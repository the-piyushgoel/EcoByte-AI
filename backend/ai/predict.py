import sys
import json
import os
import warnings
import joblib
import numpy as np
print("MODEL_EXECUTED", file=sys.stderr)
warnings.filterwarnings('ignore', category=UserWarning)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ML_DIR = os.path.join(SCRIPT_DIR, '..', '..', 'ml', 'models')
MODEL_PATH = os.path.join(ML_DIR, 'eco_byte_anomaly_model.pkl')
SCALER_PATH = os.path.join(ML_DIR, 'eco_byte_scaler.pkl')
model = joblib.load(MODEL_PATH)
scaler = joblib.load(SCALER_PATH)
FEATURES = ['FileSizeMB', 'AllocatedSizeMB', 'FileAgeYears', 'ClusterSize', 'Attributes']
def compute_risk(score):
    if score >= 75:
        return 'Critical', 'Delete or archive immediately'
    elif score >= 50:
        return 'High', 'Move to cold storage'
    elif score >= 25:
        return 'Medium', 'Review file usage'
    else:
        return 'Low', 'Keep active'
def generate_insight(meta, risk, score):
    parts = []
    size_mb = meta.get('FileSizeMB', 0)
    age_years = meta.get('FileAgeYears', 0)
    if size_mb > 100:
        parts.append(f'This file ({size_mb:.1f} MB) is significantly larger than typical files in the dataset')
    elif size_mb > 10:
        parts.append(f'This file ({size_mb:.1f} MB) is moderately sized')
    else:
        parts.append(f'This is a small file ({size_mb:.2f} MB)')

    if age_years > 3:
        parts.append(f' and has been inactive for {age_years:.1f} years, showing characteristics of long-term storage waste')
    elif age_years > 1:
        parts.append(f' and is {age_years:.1f} years old, approaching the threshold for digital waste')
    else:
        parts.append(' and was recently created or modified')

    if risk in ('Critical', 'High'):
        parts.append('. The anomaly detection model flagged this file with elevated waste indicators.')
    elif risk == 'Medium':
        parts.append('. Consider reviewing whether this file is still actively needed.')
    else:
        parts.append('. No significant waste patterns detected.')

    return ''.join(parts)
def predict(metadata):
    size_bytes = metadata.get('sizeBytes', 0)
    created_at = metadata.get('createdAt', None)
    modified_at = metadata.get('modifiedAt', None)
    file_size_mb = size_bytes / (1024 * 1024)
    allocated_size_mb = metadata.get('AllocatedSizeMB', file_size_mb)
    cluster_size = metadata.get('ClusterSize', 4096)
    attributes = metadata.get('Attributes', 0)
    now_ts = np.datetime64('now')
    if modified_at:
        try:
            dt_str = str(modified_at).replace('Z', '').split('+')[0].split('.')[0]
            mod_ts = np.datetime64(dt_str)
            age_years = float((now_ts - mod_ts) / np.timedelta64(365, 'D'))
        except Exception:
            age_years = 0.0
    elif created_at:
        try:
            dt_str = str(created_at).replace('Z', '').split('+')[0].split('.')[0]
            cr_ts = np.datetime64(dt_str)
            age_years = float((now_ts - cr_ts) / np.timedelta64(365, 'D'))
        except Exception:
            age_years = 0.0
    else:
        age_years = 0.0
    age_years = max(0.0, age_years)
    feature_dict = {
        'FileSizeMB': file_size_mb,
        'AllocatedSizeMB': allocated_size_mb,
        'FileAgeYears': age_years,
        'ClusterSize': cluster_size,
        'Attributes': attributes,
    }
    X = np.array([[feature_dict[f] for f in FEATURES]])
    X_scaled = scaler.transform(X)
    raw_score = model.decision_function(X_scaled)[0]
    anomaly_score = float(-raw_score)
    digital_waste_score = int(np.clip(anomaly_score * 200 + 50, 0, 100))
    risk, recommendation = compute_risk(digital_waste_score)
    insight = generate_insight(feature_dict, risk, digital_waste_score)
    return {
        'anomalyScore': round(anomaly_score, 4),
        'digitalWasteScore': digital_waste_score,
        'risk': risk,
        'recommendation': recommendation,
        'insight': insight,
        'features': {k: round(v, 4) for k, v in feature_dict.items()},
    }
def main():
    try:
        raw = sys.stdin.read()
        payload = json.loads(raw)
        if isinstance(payload, list):
            results = [predict(item) for item in payload]
        else:
            results = predict(payload)
        print(json.dumps(results))
    except Exception as e:
        print(json.dumps({'error': str(e)}), file=sys.stderr)
        sys.exit(1)
if __name__ == '__main__':
    main()
