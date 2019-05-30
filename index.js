const liveServer = require('live-server');
const dircompare = require('dir-compare');
const color = require('cli-color');
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});
const fs = require('fs');
const ncp = require('ncp').ncp;

const WORKING_PATH = './working';
const ORIGINAL_PATH = './original';
const states = { equal: '==', left: '->', right: '<-', distinct: '<>' };

const deleteFolderRecursive = path => {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach(function(file, index) {
      var curPath = path + '/' + file;
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};

const yesOrNo = () => {
  return new Promise(resolve => {
    readline.question(
      'Do you want to reset the working directory? (Y/N) ',
      async resp => {
        if (resp === 'y' || resp === 'Y') {
          resolve(true);
        } else if (resp === 'n' || resp === 'N') {
          resolve(false);
        } else {
          console.log(color.redBright('Invalid Input.'));
          const result = await yesOrNo();
          resolve(result);
        }
      }
    );
  });
};

const resetWorkingDirectory = () => {
  return new Promise(resolve => {
    if (fs.existsSync(WORKING_PATH)) deleteFolderRecursive(WORKING_PATH);
    fs.mkdirSync(WORKING_PATH);
    ncp(ORIGINAL_PATH, WORKING_PATH, err => {
      if (err) throw err;
      console.log(color.underline('Directory Reset.'));
      resolve();
    });
  });
};

const checkForChanges = () => {
  return new Promise(async resolve => {
    if (!fs.existsSync(WORKING_PATH)) {
      fs.mkdirSync(WORKING_PATH);
    }
    const result = dircompare.compareSync(WORKING_PATH, ORIGINAL_PATH, {
      compareSize: true
    });
    if (result.differences > 0) {
      console.log(
        color.bgRed(
          '\nDifferences found between original and working directory.'
        )
      );
      result.diffSet.forEach(entry => {
        const { name1, name2, type1, type2 } = entry;
        const state = states[entry.state];
        console.log('='.repeat(50));
        console.log(
          `${name1 || ''} (${type1}) ${state} ${name2 || ''}(${type2})`
        );
      });
      console.log('='.repeat(50));
      const resetDirectory = await yesOrNo();
      if (resetDirectory) {
        await resetWorkingDirectory();
      }
      resolve();
    } else {
      console.log(color.greenBright('\nNo differences found.\n'));
      resolve();
    }
  });
};

const parameters = {
  port: process.env.PORT || 8080,
  host: 'localhost',
  root: WORKING_PATH,
  open: true
};

const main = async () => {
  console.log(color.blueBright('Checking for changes...'));
  await checkForChanges();
  liveServer.start(parameters);
};

main();
