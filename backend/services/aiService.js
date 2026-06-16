const { spawn } = require('child_process');
const path = require('path');

const PREDICT_SCRIPT = path.resolve(__dirname, '..', 'ai', 'predict.py');

const runPrediction = (metadata) => {
  console.log('==============================');
  console.log('[AI] SERVICE CALLED');
  console.log('[AI] SCRIPT:', PREDICT_SCRIPT);
  console.log('[AI] INPUT:', JSON.stringify(metadata, null, 2));
  console.log('==============================');

  return new Promise((resolve, reject) => {
    const py = spawn('python', [PREDICT_SCRIPT], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    py.stdout.on('data', (chunk) => {
      const msg = chunk.toString();
      stdout += msg;

      console.log('[PYTHON STDOUT]');
      console.log(msg);
    });

    py.stderr.on('data', (chunk) => {
      const msg = chunk.toString();
      stderr += msg;

      console.log('[PYTHON STDERR]');
      console.log(msg);
    });

    py.on('close', (code) => {
      console.log('[AI] PYTHON PROCESS CLOSED');
      console.log('[AI] EXIT CODE:', code);

      if (stderr) {
        console.log('[AI] STDERR CONTENT:');
        console.log(stderr);
      }

      if (stdout) {
        console.log('[AI] STDOUT CONTENT:');
        console.log(stdout);
      }

      if (code !== 0) {
        console.error('[AI] Python exited with error');
        return reject(new Error(stderr || 'AI prediction failed'));
      }

      try {
        const parsed = JSON.parse(stdout);

        console.log('[AI] JSON PARSED SUCCESSFULLY');
        console.log(
          '[AI] RESULT:',
          JSON.stringify(parsed, null, 2)
        );

        resolve(parsed);
      } catch (e) {
        console.error('[AI] JSON PARSE FAILED');
        console.error(e);

        reject(
          new Error(
            `Failed to parse AI output: ${stdout}`
          )
        );
      }
    });

    py.on('error', (err) => {
      console.error('[AI] SPAWN ERROR:', err);

      reject(
        new Error(
          `Failed to spawn Python: ${err.message}`
        )
      );
    });

    py.stdin.write(JSON.stringify(metadata));
    py.stdin.end();
  });
};

const predictForFiles = async (files) => {
  const batch = files.map((f) => ({
    sizeBytes: f.sizeBytes || 0,
    createdAt: f.createdAt || null,
    modifiedAt: f.modifiedAt || null,
    extension: f.extension || '',
  }));

  try {
    const results = await runPrediction(batch);

    console.log(
      '[AI] BATCH RESULTS COUNT:',
      Array.isArray(results) ? results.length : 1
    );

    return Array.isArray(results)
      ? results
      : [results];
  } catch (err) {
    console.error(
      '[AI] Batch prediction failed:',
      err.message
    );

    return files.map(() => null);
  }
};

const predictForSingleFile = async (fileMeta) => {
  try {
    return await runPrediction(fileMeta);
  } catch (err) {
    console.error(
      '[AI] Single prediction failed:',
      err.message
    );

    return null;
  }
};

module.exports = {
  predictForFiles,
  predictForSingleFile,
};