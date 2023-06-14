const { app, BrowserWindow, dialog, ipcMain } = require('electron')
const { spawnSync } = require('child_process')
const path = require('path')
const fs = require('fs')

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js')
    },
    resizable: false
  })

  mainWindow.loadFile('index.html')
  mainWindow.setMenu(null)
  //mainWindow.webContents.openDevTools()

  

  ipcMain.handle("open_dialog", async (event, args) => {
    resp = await dialog.showOpenDialog({properties: ['openDirectory'] });

    if(resp.canceled === true)
      return {"dialog":resp}
    
    let file_list = []
    fs.readdirSync(resp.filePaths[0]).forEach(file => {
      if(path.extname(file).toLowerCase() === '.c')
          file_list.push(file)
    });

    return {"dialog":resp,"file_list":file_list}
  })
  

  ipcMain.handle("build", async (event, args) => {
    const base_dir_tmp = app.getPath("exe")
    const base_dir = base_dir_tmp.substring(0, base_dir_tmp.lastIndexOf('/'));
    const build_dir = path.join(args.location)
    const log_file = path.join(build_dir, "log.txt")
    const ldflag = args.ldflag.split(" ");
    const selectedFiles = args.selectedFiles;
    const unselectedFiles = args.unselectedFiles;
    const objectList = []
    const build_tool_dir = path.join(path.join(base_dir, "llvm"), "bin")
    const clang_path = path.join(build_tool_dir,"clang").toString()
    const opt_path = path.join(build_tool_dir,"opt").toString()
    const log_fs = fs.openSync(log_file, 'a')
    
    try {
      console.log(ldflag)
      
      const build_tmp = path.join(build_dir,"buildtmp")
      if(!fs.existsSync(build_tmp))
        fs.mkdirSync(build_tmp);

      for(const file of selectedFiles) {
        fs.appendFileSync(log_fs, file+"\n");
        
        const oribcfile = path.parse(file).name + ".bc"
        const oribcfilepath = path.join(build_tmp, oribcfile)
        const infilepath = path.join(build_dir, file)
        console.log(clang_path)
        let result = spawnSync(clang_path, ["-emit-llvm", "-c", "-o", oribcfilepath, infilepath])
        if(result.error != undefined)
        {
          fs.appendFileSync(log_fs, result.error.message)
          if(result.error.stack != undefined)
            fs.appendFileSync(log_fs, result.error.stack)
        }
        if(result.stdout != undefined)
          fs.appendFileSync(log_fs, result.stdout)
        if(result.stderr != undefined)
          fs.appendFileSync(log_fs, result.stderr)

        const obfbcfile = path.parse(file).name + ".obf.bc"
        const obfbcfilepath = path.join(build_tmp, obfbcfile)
        result = spawnSync(opt_path, ["--passes=code-flatten", oribcfilepath, "-o", obfbcfilepath])
        if(result.error != undefined)
        {
          fs.appendFileSync(log_fs, result.error.message)
          if(result.error.stack != undefined)
            fs.appendFileSync(log_fs, result.error.stack)
        }
        if(result.stdout != undefined)
          fs.appendFileSync(log_fs, result.stdout)
        if(result.stderr != undefined)
          fs.appendFileSync(log_fs, result.stderr)
        
        const outfile = path.parse(file).name + ".o"
        const outfilepath = path.join(build_tmp, outfile)
        result = spawnSync(clang_path, ["-c", "-o", outfilepath, obfbcfilepath])
        if(result.error != undefined)
        {
          fs.appendFileSync(log_fs, result.error.message)
          if(result.error.stack != undefined)
            fs.appendFileSync(log_fs, result.error.stack)
        }
        if(result.stdout != undefined)
          fs.appendFileSync(log_fs, result.stdout)
        if(result.stderr != undefined)
          fs.appendFileSync(log_fs, result.stderr)

        
        objectList.push(outfilepath);
      }

      for(const file of unselectedFiles) {
        const outfile = path.parse(file).name + ".o"
        

        const outfilepath = path.join(build_tmp, outfile)
        const infilepath = path.join(build_dir, file)
        objectList.push(outfilepath);
        const result = spawnSync(clang_path, ["-c", "-o", outfilepath, infilepath])
        fs.appendFileSync(log_fs, file+"\n");
        if(result.error != undefined)
        {
          fs.appendFileSync(log_fs, result.error.message)
          if(result.error.stack != undefined)
            fs.appendFileSync(log_fs, result.error.stack)
        }
        if(result.stdout != undefined)
          fs.appendFileSync(log_fs, result.stdout)
        if(result.stderr != undefined)
          fs.appendFileSync(log_fs, result.stderr)
      }

      const mainfile = path.parse(args.mainfile).name;
      const mainfilepath = path.join(build_dir, mainfile)

      objectList.push("-o")
      objectList.push(mainfilepath)

      objectList.concat(ldflag)

      const result = spawnSync(clang_path, objectList)
      if(result.error != undefined)
      {
        fs.appendFileSync(log_fs, result.error.message)
        if(result.error.stack != undefined)
          fs.appendFileSync(log_fs, result.error.stack)
      }
      if(result.stdout != undefined)
        fs.appendFileSync(log_fs, result.stdout)
      if(result.stderr != undefined)
        fs.appendFileSync(log_fs, result.stderr)

      fs.rmSync(build_tmp, { recursive: true, force: true })
      
    } catch (err) {
      fs.appendFileSync(log_fs, err.stack)
    }
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

