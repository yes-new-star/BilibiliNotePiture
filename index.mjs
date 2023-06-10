import { spawn } from 'child_process';


const scriptPath = './bilibilreply.mjs'; // 指定要执行的 JavaScript 脚本路径
const maxRuns = 2; // 设置要循环执行的次数

let count = 0;
const runScript = () => {
  if (count >= maxRuns) {
    console.log('脚本执行次数已达到上限，程序退出');
    return;
  }

  console.log(`开始执行第 ${count + 1} 次脚本`);

  const child = spawn('node', [scriptPath]);

  child.stdout.on('data', (data) => {
    console.log(`[STDOUT] ${data}`);
  });

  child.stderr.on('data', (data) => {
    console.error(`[STDERR] ${data}`);
  });

  child.on('close', (code) => {
    console.log(`脚本执行结束，退出码为 ${code}`);

    count++;
    setTimeout(runScript, 300);
  });
};

runScript();
