import * as core from '@actions/core';
import {Config, NodeSSH} from 'node-ssh';
import {keyboardFunction} from './keyboard';

async function run() {
  const command: string = core.getInput('command');
  const host: string = core.getInput('host') || 'localhost';
  const username: string = core.getInput('username');
  const port: number = +core.getInput('port') || 22;
  const key: string = core.getInput('key');
  const password: string = core.getInput('password');
  const passphrase: string = core.getInput('passphrase');
  const tryKeyboard: boolean = !!core.getInput('tryKeyboard');
  try {
    const ssh = await connect(
      host,
      username,
      port,
      key,
      password,
      passphrase,
      tryKeyboard
    );

    await executeCommand(ssh, command);

    ssh.dispose();
  } catch (err) {
    core.setFailed(err);
  }
}

async function connect(
  host = 'localhost',
  username: string,
  port = 22,
  key: string,
  password: string,
  passphrase: string,
  tryKeyboard: boolean
) {
  const ssh = new NodeSSH();

  try {
    const config: Config = {
      host: host,
      port: port,
      username: username,
      password: password,
      passphrase: passphrase,
      tryKeyboard: tryKeyboard,
      onKeyboardInteractive: tryKeyboard ? keyboardFunction(password) : null
    };
    if (key) {
      config.privateKey = key;
    }
    await ssh.connect(config);
  } catch (err) {
    console.error(`⚠️ GitHub Action couldn't connect to ${host}`, err);
    core.setFailed(err.message);
  }

  return ssh;
}

async function executeCommand(ssh: NodeSSH, command: string) {
  console.log(`${command}`);

  try {
    const {code} = await ssh.exec(command, [], {
      stream: 'both',
      onStdout(chunk) {
        console.log(chunk.toString('utf8'));
      },
      onStderr(chunk) {
        console.log(chunk.toString('utf8'));
      }
    });

    if (code > 0) {
      throw Error(`Command exited with code ${code}`);
    }
    console.log('✅ SSH Action Finished');
    if (ssh.isConnected()) {
      ssh.dispose();
    }
  } catch (err) {
    console.error(
      `⚠️ An error happened executing command ${command}.`,
      err?.message ?? err
    );
    core.setFailed(err.message);
    process.abort();
  }
}

process.on('uncaughtException', err => {
  if (err['code'] !== 'ECONNRESET') throw err;
});

run();
