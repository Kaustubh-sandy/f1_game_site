from flask_cors import CORS
from flask import Flask, request, jsonify
import csv
import io
import json

app = Flask(__name__)
CORS(app)

def clean_key(key):
    return key.replace('\ufeff', '').replace('"', '').strip()

def normalize(s):
    return s.strip().lower()

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    mapping_json = request.form.get('mapping')
    mapping = []
    if mapping_json:
        try:
            mapping = json.loads(mapping_json)
        except Exception:
            mapping = []

    # Build alias lookup: (old_name, old_team) -> (current_name, current_team)
    alias_lookup = {}
    for player in mapping:
        cur_name = player.get('currentName', '').strip()
        cur_team = player.get('currentTeam', '').strip()
        for alias in player.get('aliases', []):
            old_name = alias.get('name', '').strip()
            old_team = alias.get('team', '').strip()
            if old_name and old_team:
                alias_lookup[(normalize(old_name), normalize(old_team))] = (cur_name, cur_team)
        if cur_name and cur_team:
            alias_lookup[(normalize(cur_name), normalize(cur_team))] = (cur_name, cur_team)

    standings = {}
    podiums = []
    wins = {}

    files = request.files.getlist('file')
    for file in files:
        content = file.read().decode('utf-8')
        sections = content.strip().split('\n\n')
        race_table = sections[0]

        reader = csv.DictReader(io.StringIO(race_table))
        reader.fieldnames = [clean_key(h) for h in reader.fieldnames]

        race_rows = []
        for row in reader:
            driver = row.get('Driver', '').strip()
            team = row.get('Team', '').strip()
            pos = row.get('Pos.') or row.get('Position') or ''
            points_str = row.get('Pts.') or row.get('Points')
            try:
                points = int(points_str) if points_str and points_str.isdigit() else 0
            except Exception:
                points = 0

            key = (normalize(driver), normalize(team))
            canonical = alias_lookup.get(key, (driver, team))
            standings[canonical] = standings.get(canonical, 0) + points

            race_rows.append({
                'driver': canonical[0],
                'team': canonical[1],
                'pos': str(pos).strip()
            })

        # Wins for this race (all with pos == 1)
        for r in race_rows:
            if r['pos'] == '1':
                win_key = (r['driver'], r['team'])
                wins[win_key] = wins.get(win_key, 0) + 1

        # Podiums for this race (top 3 by pos, sorted as int)
        podium = sorted(
            [r for r in race_rows if r['pos'].isdigit()],
            key=lambda r: int(r['pos'])
        )[:3]
        podiums.append(podium)

    # Prepare most_wins list: everyone with at least one win, sorted by win count descending
    most_wins = [
        {'driver': d, 'team': t, 'wins': w}
        for (d, t), w in wins.items()
    ]
    most_wins.sort(key=lambda x: -x['wins'])

    # Prepare standings list
    standings_list = [
        {'driver': driver, 'team': team, 'points': points}
        for (driver, team), points in standings.items()
    ]
    standings_list.sort(key=lambda x: -x['points'])

    return jsonify({
        'status': 'success',
        'standings': standings_list,
        'most_wins': most_wins,
        'podiums': podiums
    })

if __name__ == '__main__':
    app.run(debug=True)