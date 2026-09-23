import { spawn } from 'child_process';
import { IScoreDto } from '../../types/score.types';
import { LeadGenException } from '../../exceptions/leadgen.exception';
import { ErrorCodes, LeadGenConstants } from '../../config/constants';
import { env } from '../../config/env';

export async function generateScore(
  pythonScriptName: string,
  target: string,
  scoringModelName: string,
  payload: unknown,
): Promise<IScoreDto> {
  return new Promise((resolve, reject) => {
    if (!payload) {
      reject(new LeadGenException(ErrorCodes.LEAD_SCORE_CALCULATION_FAILURE));
      return;
    }

    const scriptPath = `${LeadGenConstants.SCRIPT_EXTERNAL_PATH}/${pythonScriptName}`;
    const modelPath = `${LeadGenConstants.SCRIPT_EXTERNAL_PATH}/${scoringModelName}`;
    const jsonPayload = JSON.stringify(payload);

    const process = spawn(env.python.path, [
      LeadGenConstants.PYTHON_OPTIONS,
      scriptPath,
      target,
      modelPath,
      jsonPayload,
    ]);

    let output = '';
    let errorOutput = '';

    process.stdout.on('data', (data: Buffer) => {
      output += data.toString();
    });

    process.stderr.on('data', (data: Buffer) => {
      errorOutput += data.toString();
    });

    process.on('close', (code) => {
      if (code !== 0 || errorOutput) {
        reject(new LeadGenException(ErrorCodes.LEAD_SCORE_CALCULATION_FAILURE, [errorOutput]));
        return;
      }
      if (!output.trim()) {
        reject(new LeadGenException(ErrorCodes.LEAD_SCORE_CALCULATION_FAILURE, ['Empty response']));
        return;
      }
      if (output.includes('ERROR')) {
        reject(new LeadGenException(ErrorCodes.LEAD_SCORE_CALCULATION_FAILURE, [output]));
        return;
      }
      try {
        resolve(JSON.parse(output.trim()) as IScoreDto);
      } catch {
        reject(new LeadGenException(ErrorCodes.LEAD_SCORE_CALCULATION_FAILURE, [output]));
      }
    });
  });
}
