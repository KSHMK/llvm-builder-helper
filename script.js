window.addEventListener('DOMContentLoaded', () => {
  const projectLocationInput = document.getElementById('project-location');
  const fileListDiv = document.getElementById('file-list');
  const submitButton = document.getElementById('submit-button');
  const selectFileButton = document.getElementById('select-file-button');
  const linkerOption = document.getElementById('linker-option');
  

  // Function to populate the file list
  const populateFileList = (files) => {
    fileListDiv.innerHTML = '';

    files.forEach((file) => {
      const listItem = document.createElement('li');
      listItem.classList.add('list-group-item');
      listItem.textContent = file;
      listItem.addEventListener('mousedown', (event) => {
        if(event.button == 0)
          listItem.classList.toggle('active');
        if(event.button == 2)
        {
          mainFile = Array.from(fileListDiv.getElementsByClassName('list-main-item'));
          if(mainFile.length !== 0)
          {
            mainFile.forEach((item) => {
              item.classList.remove("list-main-item")
            })
          }
          listItem.classList.add("list-main-item");
        }
      });
      fileListDiv.appendChild(listItem);
    });
  };
  
  const getMainFile = () => {
    const fileListItems = fileListDiv.getElementsByClassName('list-main-item');
    if(fileListItems.length === 0)
      return undefined
    return fileListItems[0].textContent;
  }

  const getSelectedFiles = () => {
    const fileListItems = fileListDiv.getElementsByClassName('list-group-item');
    const selectedFiles = [];
    const unselectedFiles = [];
  
    for (let i = 0; i < fileListItems.length; i++) {
      const file = fileListItems[i].textContent;
      if (fileListItems[i].classList.contains('active')) {
        selectedFiles.push(file);
      } else {
        unselectedFiles.push(file);
      }
    }
  
    return {
      selectedFiles,
      unselectedFiles,
    };
  };

  selectFileButton.addEventListener('click', async () => {
    const projectLocation = projectLocationInput.value;
    data = await window.electronAPI.open_dialog();
    if(data["dialog"].canceled === true)
      return;
    
    projectLocationInput.value = data["dialog"].filePaths[0];
    
    populateFileList(data["file_list"]);
    submitButton.disabled = false;
  });

  

  // Event listener for the submit button
  submitButton.addEventListener('click', async () => {
    const mainfile = getMainFile();
    if(mainfile === undefined)
      return;

    const {
      selectedFiles,
      unselectedFiles,
    } = getSelectedFiles();
    
    const setting_data = {
      "location": projectLocationInput.value,
      "ldflag": linkerOption.value,
      "mainfile": mainfile,
      "selectedFiles": selectedFiles,
      "unselectedFiles": unselectedFiles
    }
    submitButton.innerHTML = "Building..."
    await window.electronAPI.build(setting_data);
    submitButton.innerHTML = "Build"
  });

  submitButton.disabled = true;
  // Initial population of file list (optional)
  //populateFileList();
});