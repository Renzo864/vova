// Инициализация PDF.js
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js';

        // Основной класс приложения
        class QuantumExplorer {
            constructor() {
                // Элементы интерфейса
                this.quantumBg = document.getElementById('quantumBg');
                this.drivesList = document.getElementById('drivesList');
                this.filesContainer = document.getElementById('filesContainer');
                this.pathNavigator = document.getElementById('pathNavigator');
                this.searchInput = document.getElementById('searchInput');
                this.previewPanel = document.getElementById('previewPanel');
                this.previewContent = document.getElementById('previewContent');
                this.fileInfo = document.getElementById('fileInfo');
                this.closePreview = document.getElementById('closePreview');
                this.selectedInfo = document.getElementById('selectedInfo');
                this.systemInfoBtn = document.getElementById('systemInfoBtn');
                this.systemInfoModal = document.getElementById('systemInfoModal');
                this.systemInfoGrid = document.getElementById('systemInfoGrid');
                this.closeSystemInfoModal = document.getElementById('closeSystemInfoModal');
                this.settingsBtn = document.getElementById('settingsBtn');
                this.settingsModal = document.getElementById('settingsModal');
                this.closeSettingsModal = document.getElementById('closeSettingsModal');
                this.settingsForm = document.getElementById('settingsForm');
                this.sortOptions = document.getElementById('sortOptions');
                this.quickAccessList = document.getElementById('quickAccessList');
                this.backBtn = document.getElementById('backBtn');
                this.forwardBtn = document.getElementById('forwardBtn');
                this.upBtn = document.getElementById('upBtn');
                this.contextMenu = document.getElementById('contextMenu');
                this.viewIconsBtn = document.getElementById('viewIcons');
                this.viewListBtn = document.getElementById('viewList');
                this.previewResizeHandle = document.getElementById('previewResizeHandle');
                this.getSystemDetailsBtn = document.getElementById('getSystemDetailsBtn');
                this.systemDetailsOutput = document.getElementById('systemDetailsOutput');
                this.refreshBtn = document.getElementById('refreshBtn');
                this.toggleSidebarBtn = document.getElementById('toggleSidebar');
                this.sidebar = document.getElementById('sidebar');
                this.sidebarToggle = document.getElementById('sidebarToggle');
                this.progressContainer = document.getElementById('progressContainer');
                this.progressText = document.getElementById('progressText');
                this.progressFill = document.getElementById('progressFill');
                this.notification = document.getElementById('notification');
                this.notificationText = document.getElementById('notificationText');
                this.dropZone = document.getElementById('dropZone');
                this.diskTotal = document.getElementById('diskTotal');
                this.diskUsed = document.getElementById('diskUsed');
                this.diskFree = document.getElementById('diskFree');
                this.diskUsageInfo = document.getElementById('diskUsageInfo');
                this.executableModal = document.getElementById('executableModal');
                this.runExecutableBtn = document.getElementById('runExecutableBtn');
                this.cancelExecutableBtn = document.getElementById('cancelExecutableBtn');
                this.resetSettingsBtn = document.getElementById('resetSettingsBtn');
                
                // Состояние приложения
                this.state = {
                    currentPath: '',
                    currentDirectoryHandle: null,
                    parentDirectoryHandle: null,
                    selectedDrive: '',
                    currentFiles: [],
                    currentSort: { field: 'name', order: 'asc' },
                    searchQuery: '',
                    viewMode: 'icons',
                    settings: {
                        theme: 'quantum',
                        defaultView: 'icons',
                        iconSize: 'medium',
                        saveSession: true,
                        showHidden: false,
                        enableHotkeys: true,
                        enableAnimations: true,
                        showPreview: true,
                        confirmDeletion: true,
                        confirmExecutable: true,
                        defaultPath: 'desktop',
                        sortPreference: 'name',
                        autoRefresh: true,
                        showShortcuts: true,
                        language: 'ru'
                    },
                    previewHandles: new Map(),
                    navigationHistory: [],
                    currentHistoryIndex: -1,
                    contextMenuTarget: null,
                    isResizingPreview: false,
                    startPreviewWidth: 0,
                    startX: 0,
                    clipboard: null,
                    selectedItems: new Set(),
                    previewHidden: false,
                    sidebarCollapsed: false,
                    isDragging: false,
                    currentExecutable: null,
                    diskSpace: {
                        total: 0,
                        used: 0,
                        free: 0
                    }
                };
                
                // Инициализация
                this.init();
            }
            
            async init() {
                this.initQuantumBackground();
                this.checkFileSystemAccess();
                this.setupEventListeners();
                await this.loadSettings();
                await this.getSystemInfo();
                await this.updateStorageInfo();
                this.applyTheme(this.state.settings.theme);
                this.setViewMode(this.state.settings.defaultView);
                this.setIconSize(this.state.settings.iconSize);
                
                if (this.state.settings.saveSession) {
                    this.restoreLastSession();
                } else {
                    this.openDefaultPath();
                }
            }
            
            checkFileSystemAccess() {
                if (!window.showDirectoryPicker || !window.showOpenFilePicker) {
                    this.showUnsupportedBrowserMessage();
                    return false;
                }
                return true;
            }
            
            showUnsupportedBrowserMessage() {
                const message = document.createElement('div');
                message.className = 'error';
                message.innerHTML = `
                    <p>Ваш браузер не поддерживает File System Access API.</p>
                    <p>Пожалуйста, используйте Chrome, Edge или Opera последней версии.</p>
                `;
                this.filesContainer.appendChild(message);
                
                const openDirBtn = document.querySelector('.open-dir-btn');
                if (openDirBtn) {
                    openDirBtn.disabled = true;
                    openDirBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Не поддерживается';
                }
            }
            
            initQuantumBackground() {
                for (let i = 0; i < 50; i++) {
                    const particle = document.createElement('div');
                    particle.className = 'particle';
                    particle.style.left = `${Math.random() * 100}%`;
                    particle.style.top = `${Math.random() * 100}%`;
                    particle.style.width = `${Math.random() * 5 + 2}px`;
                    particle.style.height = particle.style.width;
                    particle.style.animationDelay = `${Math.random() * 5}s`;
                    this.quantumBg.appendChild(particle);
                }
            }
            
            setupEventListeners() {
                // Кнопка открытия директории
                const openDirBtn = document.querySelector('.open-dir-btn');
                openDirBtn.addEventListener('click', () => this.openRootDirectory());
                
                // Закрытие панели предпросмотра
                this.closePreview.addEventListener('click', () => this.togglePreviewPanel());
                
                // Поиск файлов
                this.searchInput.addEventListener('input', (e) => {
                    this.state.searchQuery = e.target.value.toLowerCase();
                    if (this.state.searchQuery.length === 0) {
                        this.clearSearchHighlights();
                    } else {
                        this.highlightSearchResults();
                    }
                });
                
                // Кнопка информации о системе
                this.systemInfoBtn.addEventListener('click', () => {
                    this.systemInfoModal.classList.add('active');
                });
                
                // Закрытие модального окна информации
                this.closeSystemInfoModal.addEventListener('click', () => {
                    this.systemInfoModal.classList.remove('active');
                });
                
                // Получение детальной информации о системе
                this.getSystemDetailsBtn.addEventListener('click', () => {
                    this.getDetailedSystemInfo();
                });
                
                // Кнопка настроек
                this.settingsBtn.addEventListener('click', () => {
                    this.showSettingsModal();
                });
                
                // Закрытие модального окна настроек
                this.closeSettingsModal.addEventListener('click', () => {
                    this.settingsModal.classList.remove('active');
                });
                
                // Сброс настроек
                this.resetSettingsBtn.addEventListener('click', () => {
                    if (confirm('Вы уверены, что хотите сбросить все настройки к значениям по умолчанию?')) {
                        this.resetSettings();
                    }
                });
                
                // Сохранение настроек
                this.settingsForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.saveSettingsFromForm();
                });
                
                // Сортировка файлов
                this.sortOptions.addEventListener('click', (e) => {
                    const sortBtn = e.target.closest('.sort-btn');
                    if (sortBtn) {
                        const field = sortBtn.dataset.sort;
                        
                        if (this.state.currentSort.field === field) {
                            this.state.currentSort.order = this.state.currentSort.order === 'asc' ? 'desc' : 'asc';
                        } else {
                            this.state.currentSort.field = field;
                            this.state.currentSort.order = sortBtn.dataset.order || 'asc';
                        }
                        
                        this.sortFiles();
                        this.updateSortButtons();
                        this.saveSettings();
                    }
                });
                
                // Быстрый доступ
                this.quickAccessList.addEventListener('click', (e) => {
                    const item = e.target.closest('li');
                    if (item) {
                        const path = item.dataset.path;
                        this.openQuickAccessFolder(path);
                    }
                });
                
                // Диски и системные папки
                this.drivesList.addEventListener('click', (e) => {
                    const driveItem = e.target.closest('.drive-item');
                    if (driveItem) {
                        const path = driveItem.dataset.path;
                        if (path === 'system') {
                            this.openSystemDirectory();
                        } else {
                            this.openQuickAccessFolder(path);
                        }
                    }
                });
                
                // Кнопки навигации
                this.backBtn.addEventListener('click', () => this.navigateBack());
                this.forwardBtn.addEventListener('click', () => this.navigateForward());
                this.upBtn.addEventListener('click', () => this.navigateUp());
                
                // Кнопки вида (плитка/список)
                this.viewIconsBtn = document.getElementById('viewIcons');
                this.viewListBtn = document.getElementById('viewList');
                this.viewIconsBtn.addEventListener('click', () => this.setViewMode('icons'));
                this.viewListBtn.addEventListener('click', () => this.setViewMode('list'));
                
                // Кнопка обновления
                this.refreshBtn.addEventListener('click', () => this.refreshCurrentDirectory());
                
                // Кнопка скрытия/показа боковой панели
                this.toggleSidebarBtn.addEventListener('click', () => this.toggleSidebar());
                this.sidebarToggle.addEventListener('click', () => this.toggleSidebar());
                
                // Обработка горячих клавиш
                document.addEventListener('keydown', (e) => {
                    if (!this.state.settings.enableHotkeys) return;
                    
                    // F5 - обновление
                    if (e.key === 'F5') {
                        e.preventDefault();
                        this.refreshCurrentDirectory();
                    }
                    // Win + E или Ctrl + E - открыть проводник
                    else if ((e.key === 'e' || e.key === 'E') && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        this.openRootDirectory();
                    }
                    // Ctrl + Shift + N - новая папка
                    else if ((e.key === 'n' || e.key === 'N') && e.ctrlKey && e.shiftKey) {
                        e.preventDefault();
                        this.createNewFolder();
                    }
                    // F2 - переименовать
                    else if (e.key === 'F2') {
                        e.preventDefault();
                        if (this.state.contextMenuTarget) {
                            const fileIndex = Array.from(this.filesContainer.children).indexOf(this.state.contextMenuTarget);
                            if (fileIndex !== -1) {
                                const fileItem = this.state.currentFiles[fileIndex];
                                this.renameFile(fileItem.handle);
                            }
                        }
                    }
                    // ESC - закрыть предпросмотр
                    else if (e.key === 'Escape') {
                        if (this.previewPanel.classList.contains('active')) {
                            e.preventDefault();
                            this.togglePreviewPanel();
                        }
                    }
                    // Backspace - на уровень выше
                    else if (e.key === 'Backspace' && !e.target.matches('input, textarea')) {
                        e.preventDefault();
                        this.navigateUp();
                    }
                    // Delete - удалить
                    else if (e.key === 'Delete' && !e.target.matches('input, textarea')) {
                        e.preventDefault();
                        if (this.state.contextMenuTarget) {
                            const fileIndex = Array.from(this.filesContainer.children).indexOf(this.state.contextMenuTarget);
                            if (fileIndex !== -1) {
                                const fileItem = this.state.currentFiles[fileIndex];
                                this.deleteFile(fileItem.handle);
                            }
                        }
                    }
                });
                
                // Изменение размера панели предпросмотра
                this.previewResizeHandle.addEventListener('mousedown', (e) => {
                    this.state.isResizingPreview = true;
                    this.state.startPreviewWidth = parseInt(getComputedStyle(this.previewPanel).width);
                    this.state.startX = e.clientX;
                    document.body.style.cursor = 'col-resize';
                    document.body.style.userSelect = 'none';
                    
                    const onMouseMove = (e) => {
                        if (!this.state.isResizingPreview) return;
                        const dx = e.clientX - this.state.startX;
                        let newWidth = this.state.startPreviewWidth - dx;
                        newWidth = Math.max(200, Math.min(600, newWidth));
                        document.documentElement.style.setProperty('--preview-width', `${newWidth}px`);
                    };
                    
                    const onMouseUp = () => {
                        this.state.isResizingPreview = false;
                        document.body.style.cursor = '';
                        document.body.style.userSelect = '';
                        document.removeEventListener('mousemove', onMouseMove);
                        document.removeEventListener('mouseup', onMouseUp);
                    };
                    
                    document.addEventListener('mousemove', onMouseMove);
                    document.addEventListener('mouseup', onMouseUp);
                });
                
                // Обработка клика вне модальных окон для их закрытия
                document.addEventListener('click', (e) => {
                    if (e.target.classList.contains('modal')) {
                        e.target.classList.remove('active');
                    }
                    
                    if (!e.target.closest('.context-menu') && this.contextMenu.classList.contains('active')) {
                        this.contextMenu.classList.remove('active');
                    }
                });
                
                // Контекстное меню
                document.getElementById('openFile').addEventListener('click', () => this.handleContextMenuAction('open'));
                document.getElementById('openWith').addEventListener('click', () => this.handleContextMenuAction('openWith'));
                document.getElementById('copyFile').addEventListener('click', () => this.handleContextMenuAction('copy'));
                document.getElementById('cutFile').addEventListener('click', () => this.handleContextMenuAction('cut'));
                document.getElementById('pasteFile').addEventListener('click', () => this.handleContextMenuAction('paste'));
                document.getElementById('newFolder').addEventListener('click', () => this.handleContextMenuAction('newFolder'));
                document.getElementById('deleteFile').addEventListener('click', () => this.handleContextMenuAction('delete'));
                document.getElementById('renameFile').addEventListener('click', () => this.handleContextMenuAction('rename'));
                document.getElementById('propertiesFile').addEventListener('click', () => this.handleContextMenuAction('properties'));
                
                // Контекстное меню для файлов
                this.filesContainer.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    
                    const fileItem = e.target.closest('.file-item');
                    if (fileItem) {
                        this.state.contextMenuTarget = fileItem;
                        
                        this.contextMenu.style.top = `${e.clientY}px`;
                        this.contextMenu.style.left = `${e.clientX}px`;
                        this.contextMenu.classList.add('active');
                    }
                });
                
                // Выделение файлов
                this.filesContainer.addEventListener('click', (e) => {
                    if (e.ctrlKey || e.metaKey) {
                        const fileItem = e.target.closest('.file-item');
                        if (fileItem) {
                            fileItem.classList.toggle('highlight');
                            const fileIndex = Array.from(this.filesContainer.children).indexOf(fileItem);
                            if (fileItem.classList.contains('highlight')) {
                                this.state.selectedItems.add(fileIndex);
                            } else {
                                this.state.selectedItems.delete(fileIndex);
                            }
                            this.updateSelectedInfo(this.state.selectedItems.size);
                        }
                    } else if (!e.target.closest('.file-name') && !e.target.closest('.file-icon')) {
                        // Сброс выделения при обычном клике
                        this.clearSelection();
                    }
                });
                
                // Перетаскивание файлов
                document.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    if (!this.state.isDragging) {
                        this.state.isDragging = true;
                        this.dropZone.classList.add('active');
                    }
                });
                
                document.addEventListener('dragleave', (e) => {
                    e.preventDefault();
                    if (this.state.isDragging) {
                        this.state.isDragging = false;
                        this.dropZone.classList.remove('active');
                    }
                });
                
                document.addEventListener('drop', (e) => {
                    e.preventDefault();
                    this.state.isDragging = false;
                    this.dropZone.classList.remove('active');
                    
                    if (this.state.currentDirectoryHandle && e.dataTransfer.files.length > 0) {
                        this.uploadFiles(e.dataTransfer.files);
                    }
                });
                
                // Исполняемые файлы
                this.runExecutableBtn.addEventListener('click', () => {
                    if (this.state.currentExecutable) {
                        this.executableModal.classList.remove('active');
                        this.runFile(this.state.currentExecutable.handle, this.state.currentExecutable.file);
                    }
                });
                
                this.cancelExecutableBtn.addEventListener('click', () => {
                    this.executableModal.classList.remove('active');
                    this.state.currentExecutable = null;
                });
            }
            
            async uploadFiles(files) {
                this.showProgress('Загрузка файлов...');
                
                try {
                    const totalFiles = files.length;
                    let uploadedCount = 0;
                    
                    for (let i = 0; i < files.length; i++) {
                        const file = files[i];
                        
                        // Обновляем прогресс
                        uploadedCount++;
                        const progress = Math.round((uploadedCount / totalFiles) * 100);
                        this.updateProgress(progress, `Загрузка: ${file.name}`);
                        
                        // Создаем новый файл
                        const newFileHandle = await this.state.currentDirectoryHandle.getFileHandle(file.name, { create: true });
                        const writable = await newFileHandle.createWritable();
                        
                        // Читаем содержимое файла
                        const fileData = await file.arrayBuffer();
                        
                        // Записываем содержимое
                        await writable.write(fileData);
                        await writable.close();
                    }
                    
                    // Обновляем список файлов
                    await this.listFiles(this.state.currentDirectoryHandle);
                    this.hideProgress();
                    this.showNotification('Файлы успешно загружены', 'success');
                } catch (error) {
                    console.error('Ошибка при загрузке файлов:', error);
                    this.hideProgress();
                    this.showNotification('Ошибка при загрузке файлов', 'error');
                }
            }
            
            showProgress(text) {
                this.progressText.textContent = text;
                this.progressFill.style.width = '0%';
                this.progressContainer.classList.add('active');
            }
            
            updateProgress(percent, text = '') {
                this.progressFill.style.width = `${percent}%`;
                if (text) {
                    this.progressText.textContent = text;
                }
            }
            
            hideProgress() {
                this.progressContainer.classList.remove('active');
            }
            
            showNotification(text, type = 'success') {
                this.notificationText.textContent = text;
                this.notification.className = `notification ${type}`;
                this.notification.classList.add('active');
                
                setTimeout(() => {
                    this.notification.classList.remove('active');
                }, 3000);
            }
            
            toggleSidebar() {
                this.state.sidebarCollapsed = !this.state.sidebarCollapsed;
                this.sidebar.classList.toggle('collapsed', this.state.sidebarCollapsed);
                this.sidebarToggle.querySelector('i').className = this.state.sidebarCollapsed ? 
                    'fas fa-chevron-right' : 'fas fa-chevron-left';
                this.saveSettings();
            }
            
            togglePreviewPanel() {
                this.state.previewHidden = !this.state.previewHidden;
                if (this.state.previewHidden) {
                    this.closeFilePreview();
                    this.previewPanel.classList.add('hidden');
                } else {
                    this.previewPanel.classList.remove('hidden');
                    if (this.state.contextMenuTarget) {
                        const fileIndex = Array.from(this.filesContainer.children).indexOf(this.state.contextMenuTarget);
                        if (fileIndex !== -1) {
                            const fileItem = this.state.currentFiles[fileIndex];
                            if (fileItem.type !== 'directory') {
                                this.showFilePreview(fileItem.handle, fileItem.file);
                            }
                        }
                    }
                }
                this.saveSettings();
            }
            
            clearSelection() {
                const highlightedItems = this.filesContainer.querySelectorAll('.file-item.highlight');
                highlightedItems.forEach(item => {
                    item.classList.remove('highlight');
                });
                this.state.selectedItems.clear();
                this.updateSelectedInfo(0);
            }
            
            async refreshCurrentDirectory() {
                if (this.state.currentDirectoryHandle) {
                    try {
                        this.filesContainer.innerHTML = '<div class="loading">Обновление...</div>';
                        await this.listFiles(this.state.currentDirectoryHandle);
                        this.showNotification('Папка обновлена', 'success');
                    } catch (error) {
                        console.error('Ошибка при обновлении:', error);
                        this.showError('Не удалось обновить содержимое', error.message);
                    }
                }
            }
            
            setViewMode(mode) {
                this.state.viewMode = mode;
                
                if (mode === 'icons') {
                    this.filesContainer.classList.remove('list-view');
                    this.viewIconsBtn.classList.add('active');
                    this.viewListBtn.classList.remove('active');
                } else {
                    this.filesContainer.classList.add('list-view');
                    this.viewIconsBtn.classList.remove('active');
                    this.viewListBtn.classList.add('active');
                }
                
                this.renderFiles();
                this.state.settings.defaultView = mode;
                this.saveSettings();
            }
            
            setIconSize(size) {
                let iconSize;
                switch (size) {
                    case 'small': iconSize = 32; break;
                    case 'large': iconSize = 64; break;
                    default: iconSize = 48;
                }
                
                document.documentElement.style.setProperty('--icon-size', `${iconSize}px`);
                this.state.settings.iconSize = size;
                this.saveSettings();
            }
            
            handleContextMenuAction(action) {
                this.contextMenu.classList.remove('active');
                
                if (!this.state.contextMenuTarget && action !== 'newFolder' && action !== 'paste') return;
                
                const fileIndex = Array.from(this.filesContainer.children).indexOf(this.state.contextMenuTarget);
                
                switch (action) {
                    case 'open':
                        if (fileIndex !== -1) {
                            const fileItem = this.state.currentFiles[fileIndex];
                            if (fileItem.type === 'directory') {
                                this.openDirectory(fileItem.handle);
                            } else {
                                this.openFile(fileItem.handle, fileItem.file);
                            }
                        }
                        break;
                    case 'openWith':
                        if (fileIndex !== -1) {
                            const fileItem = this.state.currentFiles[fileIndex];
                            this.openFileWith(fileItem.handle, fileItem.file);
                        }
                        break;
                    case 'copy':
                        if (fileIndex !== -1) {
                            const fileItem = this.state.currentFiles[fileIndex];
                            this.copyFile(fileItem.handle);
                            this.showNotification('Файл скопирован', 'success');
                        }
                        break;
                    case 'cut':
                        if (fileIndex !== -1) {
                            const fileItem = this.state.currentFiles[fileIndex];
                            this.cutFile(fileItem.handle);
                            this.showNotification('Файл вырезан', 'success');
                        }
                        break;
                    case 'paste':
                        this.pasteFile();
                        break;
                    case 'newFolder':
                        this.createNewFolder();
                        break;
                    case 'delete':
                        if (fileIndex !== -1) {
                            const fileItem = this.state.currentFiles[fileIndex];
                            this.deleteFile(fileItem.handle);
                        }
                        break;
                    case 'rename':
                        if (fileIndex !== -1) {
                            const fileItem = this.state.currentFiles[fileIndex];
                            this.renameFile(fileItem.handle);
                        }
                        break;
                    case 'properties':
                        if (fileIndex !== -1) {
                            const fileItem = this.state.currentFiles[fileIndex];
                            this.showFileProperties(fileItem);
                        }
                        break;
                }
            }
            
            async createNewFolder() {
                const folderName = prompt('Введите имя новой папки:', 'Новая папка');
                if (folderName && this.state.currentDirectoryHandle) {
                    try {
                        await this.state.currentDirectoryHandle.getDirectoryHandle(folderName, { create: true });
                        await this.listFiles(this.state.currentDirectoryHandle);
                        this.showNotification('Папка создана', 'success');
                    } catch (error) {
                        console.error('Ошибка при создании папки:', error);
                        this.showError('Не удалось создать папку', error.message);
                    }
                }
            }
            
            async openRootDirectory() {
                try {
                    const directoryHandle = await window.showDirectoryPicker({
                        mode: 'readwrite',
                        startIn: 'desktop'
                    });
                    
                    this.state.currentDirectoryHandle = directoryHandle;
                    this.state.selectedDrive = directoryHandle.name;
                    this.state.currentPath = directoryHandle.name;
                    
                    // Получаем родительскую директорию
                    try {
                        this.state.parentDirectoryHandle = await directoryHandle.getParent();
                        this.upBtn.disabled = false;
                    } catch (error) {
                        this.state.parentDirectoryHandle = null;
                        this.upBtn.disabled = true;
                    }
                    
                    this.addToNavigationHistory(directoryHandle);
                    this.updatePathNavigation();
                    await this.listFiles(directoryHandle);
                    await this.updateStorageInfo();
                    this.updateNavButtons();
                    this.saveSettings();
                } catch (error) {
                    console.error('Ошибка при открытии директории:', error);
                    if (error.name !== 'AbortError') {
                        this.showError('Не удалось открыть директорию', error.message);
                    }
                }
            }
            
            async navigateUp() {
                if (this.state.parentDirectoryHandle) {
                    try {
                        this.state.currentDirectoryHandle = this.state.parentDirectoryHandle;
                        this.state.currentPath = this.state.currentPath.split('/').slice(0, -1).join('/');
                        
                        // Получаем нового родителя
                        try {
                            this.state.parentDirectoryHandle = await this.state.currentDirectoryHandle.getParent();
                            this.upBtn.disabled = false;
                        } catch (error) {
                            this.state.parentDirectoryHandle = null;
                            this.upBtn.disabled = true;
                        }
                        
                        this.addToNavigationHistory(this.state.currentDirectoryHandle);
                        this.updatePathNavigation();
                        await this.listFiles(this.state.currentDirectoryHandle);
                        await this.updateStorageInfo();
                        this.updateNavButtons();
                        this.saveSettings();
                    } catch (error) {
                        console.error('Ошибка при переходе в родительскую папку:', error);
                        this.showError('Не удалось перейти в родительскую папку', error.message);
                    }
                }
            }
            
            async openSystemDirectory() {
                try {
                    const directoryHandle = await window.showDirectoryPicker({
                        mode: 'readwrite',
                        startIn: 'documents'
                    });
                    
                    let systemHandle = directoryHandle;
                    while (systemHandle && systemHandle.name !== '') {
                        try {
                            systemHandle = await systemHandle.getParent();
                        } catch (error) {
                            break;
                        }
                    }
                    
                    if (systemHandle) {
                        this.state.currentDirectoryHandle = systemHandle;
                        this.state.selectedDrive = 'System';
                        this.state.currentPath = 'System';
                        
                        // Получаем родительскую директорию
                        try {
                            this.state.parentDirectoryHandle = await systemHandle.getParent();
                            this.upBtn.disabled = false;
                        } catch (error) {
                            this.state.parentDirectoryHandle = null;
                            this.upBtn.disabled = true;
                        }
                        
                        this.addToNavigationHistory(systemHandle);
                        this.updatePathNavigation();
                        await this.listFiles(systemHandle);
                        await this.updateStorageInfo();
                        this.updateNavButtons();
                        this.saveSettings();
                    } else {
                        throw new Error('Не удалось получить доступ к системным файлам');
                    }
                } catch (error) {
                    console.error('Ошибка при открытии системной директории:', error);
                    this.showError('Не удалось открыть системные файлы', 'Попробуйте выбрать другую папку');
                }
            }
            
            addToNavigationHistory(directoryHandle) {
                if (this.state.currentHistoryIndex < this.state.navigationHistory.length - 1) {
                    this.state.navigationHistory = this.state.navigationHistory.slice(0, this.state.currentHistoryIndex + 1);
                }
                
                this.state.navigationHistory.push({
                    handle: directoryHandle,
                    path: this.state.currentPath,
                    parentHandle: this.state.parentDirectoryHandle
                });
                
                this.state.currentHistoryIndex = this.state.navigationHistory.length - 1;
            }
            
            async navigateBack() {
                if (this.state.currentHistoryIndex > 0) {
                    this.state.currentHistoryIndex--;
                    const historyItem = this.state.navigationHistory[this.state.currentHistoryIndex];
                    
                    this.state.currentDirectoryHandle = historyItem.handle;
                    this.state.currentPath = historyItem.path;
                    this.state.parentDirectoryHandle = historyItem.parentHandle;
                    
                    this.upBtn.disabled = !this.state.parentDirectoryHandle;
                    this.updatePathNavigation();
                    await this.listFiles(historyItem.handle);
                    await this.updateStorageInfo();
                    this.updateNavButtons();
                }
            }
            
            async navigateForward() {
                if (this.state.currentHistoryIndex < this.state.navigationHistory.length - 1) {
                    this.state.currentHistoryIndex++;
                    const historyItem = this.state.navigationHistory[this.state.currentHistoryIndex];
                    
                    this.state.currentDirectoryHandle = historyItem.handle;
                    this.state.currentPath = historyItem.path;
                    this.state.parentDirectoryHandle = historyItem.parentHandle;
                    
                    this.upBtn.disabled = !this.state.parentDirectoryHandle;
                    this.updatePathNavigation();
                    await this.listFiles(historyItem.handle);
                    await this.updateStorageInfo();
                    this.updateNavButtons();
                }
            }
            
            updateNavButtons() {
                this.backBtn.disabled = this.state.currentHistoryIndex <= 0;
                this.forwardBtn.disabled = this.state.currentHistoryIndex >= this.state.navigationHistory.length - 1;
            }
            
            async openQuickAccessFolder(path) {
                try {
                    let directoryHandle;
                    
                    switch (path) {
                        case 'desktop':
                            directoryHandle = await window.showDirectoryPicker({
                                startIn: 'desktop'
                            });
                            break;
                        case 'downloads':
                            directoryHandle = await window.showDirectoryPicker({
                                startIn: 'downloads'
                            });
                            break;
                        case 'documents':
                            directoryHandle = await window.showDirectoryPicker({
                                startIn: 'documents'
                            });
                            break;
                        case 'pictures':
                            directoryHandle = await window.showDirectoryPicker({
                                startIn: 'pictures'
                            });
                            break;
                        case 'music':
                            directoryHandle = await window.showDirectoryPicker({
                                startIn: 'music'
                            });
                            break;
                        case 'videos':
                            directoryHandle = await window.showDirectoryPicker({
                                startIn: 'videos'
                            });
                            break;
                        default:
                            throw new Error('Неизвестный путь быстрого доступа');
                    }
                    
                    this.state.currentDirectoryHandle = directoryHandle;
                    this.state.selectedDrive = directoryHandle.name;
                    this.state.currentPath = directoryHandle.name;
                    
                    // Получаем родительскую директорию
                    try {
                        this.state.parentDirectoryHandle = await directoryHandle.getParent();
                        this.upBtn.disabled = false;
                    } catch (error) {
                        this.state.parentDirectoryHandle = null;
                        this.upBtn.disabled = true;
                    }
                    
                    this.addToNavigationHistory(directoryHandle);
                    this.updatePathNavigation();
                    await this.listFiles(directoryHandle);
                    await this.updateStorageInfo();
                    this.updateNavButtons();
                    this.saveSettings();
                } catch (error) {
                    console.error('Ошибка при открытии папки быстрого доступа:', error);
                    this.showError('Не удалось открыть папку', error.message);
                }
            }
            
            async openDefaultPath() {
                try {
                    let directoryHandle;
                    
                    switch (this.state.settings.defaultPath) {
                        case 'desktop':
                            directoryHandle = await window.showDirectoryPicker({
                                startIn: 'desktop'
                            });
                            break;
                        case 'downloads':
                            directoryHandle = await window.showDirectoryPicker({
                                startIn: 'downloads'
                            });
                            break;
                        case 'documents':
                            directoryHandle = await window.showDirectoryPicker({
                                startIn: 'documents'
                            });
                            break;
                        case 'pictures':
                            directoryHandle = await window.showDirectoryPicker({
                                startIn: 'pictures'
                            });
                            break;
                        default:
                            directoryHandle = await window.showDirectoryPicker({
                                startIn: 'desktop'
                            });
                    }
                    
                    this.state.currentDirectoryHandle = directoryHandle;
                    this.state.selectedDrive = directoryHandle.name;
                    this.state.currentPath = directoryHandle.name;
                    
                    // Получаем родительскую директорию
                    try {
                        this.state.parentDirectoryHandle = await directoryHandle.getParent();
                        this.upBtn.disabled = false;
                    } catch (error) {
                        this.state.parentDirectoryHandle = null;
                        this.upBtn.disabled = true;
                    }
                    
                    this.addToNavigationHistory(directoryHandle);
                    this.updatePathNavigation();
                    await this.listFiles(directoryHandle);
                    await this.updateStorageInfo();
                    this.updateNavButtons();
                    this.saveSettings();
                } catch (error) {
                    console.error('Ошибка при открытии папки по умолчанию:', error);
                    this.showError('Не удалось открыть папку', error.message);
                }
            }
            
            updatePathNavigation() {
                this.pathNavigator.innerHTML = '';
                
                const pathParts = this.state.currentPath.split('/');
                
                pathParts.forEach((part, index) => {
                    const pathSegment = document.createElement('div');
                    pathSegment.className = 'path-segment';
                    pathSegment.textContent = part;
                    
                    const fullPath = pathParts.slice(0, index + 1).join('/');
                    pathSegment.addEventListener('click', async () => {
                        try {
                            let handle = this.state.currentDirectoryHandle;
                            
                            // Находим нужный handle
                            for (let i = pathParts.length - 1; i > index; i--) {
                                handle = await handle.getParent();
                            }
                            
                            this.state.currentDirectoryHandle = handle;
                            this.state.currentPath = fullPath;
                            
                            // Получаем родительскую директорию
                            try {
                                this.state.parentDirectoryHandle = await handle.getParent();
                                this.upBtn.disabled = false;
                            } catch (error) {
                                this.state.parentDirectoryHandle = null;
                                this.upBtn.disabled = true;
                            }
                            
                            this.addToNavigationHistory(handle);
                            await this.listFiles(handle);
                            await this.updateStorageInfo();
                            this.updateNavButtons();
                            this.saveSettings();
                        } catch (error) {
                            console.error('Ошибка при переходе по пути:', error);
                        }
                    });
                    
                    this.pathNavigator.appendChild(pathSegment);
                    
                    if (index < pathParts.length - 1) {
                        const separator = document.createElement('span');
                        separator.className = 'path-separator';
                        separator.textContent = '/';
                        this.pathNavigator.appendChild(separator);
                    }
                });
            }
            
            async listFiles(directoryHandle) {
                this.filesContainer.innerHTML = '<div class="loading">Загрузка...</div>';
                
                try {
                    const files = [];
                    const directories = [];
                    
                    for await (const entry of directoryHandle.values()) {
                        if (entry.kind === 'file') {
                            const file = await entry.getFile();
                            files.push({
                                handle: entry,
                                name: entry.name,
                                type: this.getFileType(entry.name),
                                size: file.size,
                                modified: file.lastModified,
                                file: file
                            });
                        } else if (entry.kind === 'directory') {
                            directories.push({
                                handle: entry,
                                name: entry.name,
                                type: 'directory',
                                size: 0,
                                modified: Date.now()
                            });
                        }
                    }
                    
                    this.state.currentFiles = [...directories, ...files];
                    this.sortFiles();
                    this.updateFolderStorageInfo(directoryHandle);
                    this.updateDiskUsage();
                } catch (error) {
                    console.error('Ошибка при чтении директории:', error);
                    this.filesContainer.innerHTML = '<div class="error">Не удалось загрузить содержимое</div>';
                }
            }
            
            async updateDiskUsage() {
                try {
                    let totalSize = 0;
                    let fileCount = 0;
                    
                    const calculateSize = async (dirHandle) => {
                        for await (const entry of dirHandle.values()) {
                            if (entry.kind === 'file') {
                                const file = await entry.getFile();
                                totalSize += file.size;
                                fileCount++;
                            } else if (entry.kind === 'directory') {
                                await calculateSize(entry);
                            }
                        }
                    };
                    
                    await calculateSize(this.state.currentDirectoryHandle);
                    
                    // Обновляем информацию о диске
                    this.state.diskSpace = {
                        total: totalSize,
                        used: totalSize,
                        free: 0 // Для простоты, в реальном приложении нужно получить реальные данные о диске
                    };
                    
                    this.diskTotal.textContent = this.formatFileSize(totalSize);
                    this.diskUsed.textContent = this.formatFileSize(totalSize);
                    this.diskFree.textContent = '—'; // В браузере мы не можем получить реальное свободное место
                    
                } catch (error) {
                    console.error('Ошибка при вычислении размера папки:', error);
                    this.diskTotal.textContent = '—';
                    this.diskUsed.textContent = '—';
                    this.diskFree.textContent = '—';
                }
            }
            
            sortFiles() {
                const { field, order } = this.state.currentSort;
                
                this.state.currentFiles.sort((a, b) => {
                    let compareResult = 0;
                    
                    switch (field) {
                        case 'name':
                            compareResult = a.name.localeCompare(b.name);
                            break;
                        case 'size':
                            compareResult = a.size - b.size;
                            break;
                        case 'date':
                            compareResult = a.modified - b.modified;
                            break;
                        case 'type':
                            compareResult = this.getFileType(a.name).localeCompare(this.getFileType(b.name)) || 
                                           a.name.localeCompare(b.name);
                            break;
                        default:
                            compareResult = a.name.localeCompare(b.name);
                    }
                    
                    return order === 'asc' ? compareResult : -compareResult;
                });
                
                this.renderFiles();
            }
            
            renderFiles() {
                this.filesContainer.innerHTML = '';
                
                if (this.state.currentFiles.length === 0) {
                    this.filesContainer.innerHTML = '<div class="error">Папка пуста</div>';
                    return;
                }
                
                this.state.currentFiles.forEach((item, index) => {
                    const fileItem = document.createElement('div');
                    fileItem.className = `file-item ${item.type === 'directory' ? 'directory' : ''} ${
                        this.state.viewMode === 'list' ? 'list-item' : ''
                    } ${this.state.selectedItems.has(index) ? 'highlight' : ''}`;
                    
                    const iconClass = this.getFileIconClass(item.type, item.name);
                    const sizeInfo = item.type === 'directory' ? '' : `<div class="file-size">${this.formatFileSize(item.size)}</div>`;
                    
                    fileItem.innerHTML = `
                        <div class="file-icon"><i class="fas ${iconClass}"></i></div>
                        <div class="file-name">${item.name}</div>
                        ${sizeInfo}
                    `;
                    
                    fileItem.addEventListener('click', (e) => {
                        if (e.ctrlKey || e.metaKey) {
                            fileItem.classList.toggle('highlight');
                            if (fileItem.classList.contains('highlight')) {
                                this.state.selectedItems.add(index);
                            } else {
                                this.state.selectedItems.delete(index);
                            }
                            this.updateSelectedInfo(this.state.selectedItems.size);
                            return;
                        }
                        
                        if (item.type === 'directory') {
                            this.openDirectory(item.handle);
                        } else {
                            if (this.state.settings.showPreview) {
                                this.showFilePreview(item.handle, item.file);
                            } else {
                                this.openFile(item.handle, item.file);
                            }
                        }
                    });
                    
                    fileItem.addEventListener('dblclick', () => {
                        if (item.type === 'directory') {
                            this.openDirectory(item.handle);
                        } else {
                            this.openFile(item.handle, item.file);
                        }
                    });
                    
                    if (this.state.settings.enableAnimations) {
                        fileItem.style.animationDelay = `${index * 0.05}s`;
                        fileItem.classList.add('fade-in');
                    }
                    
                    this.filesContainer.appendChild(fileItem);
                });
                
                if (this.state.selectedItems.size === 0) {
                    this.updateSelectedInfo(0);
                }
                
                if (this.state.searchQuery.length > 0) {
                    this.highlightSearchResults();
                }
            }
            
            async openDirectory(dirHandle) {
                try {
                    this.state.currentDirectoryHandle = dirHandle;
                    this.state.currentPath += `/${dirHandle.name}`;
                    
                    // Получаем родительскую директорию
                    try {
                        this.state.parentDirectoryHandle = await dirHandle.getParent();
                        this.upBtn.disabled = false;
                    } catch (error) {
                        this.state.parentDirectoryHandle = null;
                        this.upBtn.disabled = true;
                    }
                    
                    this.addToNavigationHistory(dirHandle);
                    this.updatePathNavigation();
                    await this.listFiles(dirHandle);
                    this.updateNavButtons();
                    this.saveSettings();
                } catch (error) {
                    console.error('Ошибка при открытии папки:', error);
                    this.showError('Не удалось открыть папку', error.message);
                }
            }
            
            async openFile(fileHandle, file) {
                try {
                    const fileType = this.getFileType(fileHandle.name);
                    
                    if (fileType === 'executable') {
                        if (this.state.settings.confirmExecutable) {
                            this.state.currentExecutable = { handle: fileHandle, file };
                            this.executableModal.classList.add('active');
                        } else {
                            this.runFile(fileHandle, file);
                        }
                    } else if (fileType === 'shortcut') {
                        this.handleShortcut(file);
                    } else {
                        const blob = await fileHandle.getFile();
                        const url = URL.createObjectURL(blob);
                        
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = fileHandle.name;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        
                        setTimeout(() => URL.revokeObjectURL(url), 100);
                    }
                } catch (error) {
                    console.error('Ошибка при открытии файла:', error);
                    this.showError('Не удалось открыть файл', error.message);
                }
            }
            
            async handleShortcut(file) {
                try {
                    const text = await file.text();
                    // Простая имитация обработки ярлыка - ищем URL или путь в тексте
                    const urlMatch = text.match(/URL=(.*)/i);
                    const pathMatch = text.match(/Path=(.*)/i);
                    
                    if (urlMatch && urlMatch[1]) {
                        // Если это интернет-ярлык, открываем в новой вкладке
                        window.open(urlMatch[1], '_blank');
                        this.showNotification('Ярлык открыт в новой вкладке', 'success');
                    } else if (pathMatch && pathMatch[1]) {
                        // Если это ярлык файла, пытаемся открыть
                        const path = pathMatch[1].trim();
                        if (path.startsWith('http')) {
                            window.open(path, '_blank');
                            this.showNotification('Ярлык открыт в новой вкладке', 'success');
                        } else {
                            // Пытаемся найти файл по указанному пути
                            this.showNotification(`Ярлык указывает на: ${path}`, 'info');
                        }
                    } else {
                        this.showNotification('Не удалось определить цель ярлыка', 'warning');
                    }
                } catch (error) {
                    console.error('Ошибка при обработке ярлыка:', error);
                    this.showError('Не удалось обработать ярлык', error.message);
                }
            }
            
            async runFile(fileHandle, file) {
                try {
                    const blob = await fileHandle.getFile();
                    const url = URL.createObjectURL(blob);
                    
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = fileHandle.name;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    
                    setTimeout(() => URL.revokeObjectURL(url), 100);
                    this.showNotification('Файл запущен', 'success');
                } catch (error) {
                    console.error('Ошибка при запуске файла:', error);
                    this.showError('Не удалось запустить файл', error.message);
                }
            }
            
            async openFileWith(fileHandle, file) {
                this.openFile(fileHandle, file);
            }
            
            async copyFile(fileHandle) {
                try {
                    const file = await fileHandle.getFile();
                    this.state.clipboard = {
                        action: 'copy',
                        fileHandle: fileHandle,
                        file: file
                    };
                } catch (error) {
                    console.error('Ошибка при копировании файла:', error);
                    this.showError('Не удалось скопировать файл', error.message);
                }
            }
            
            async cutFile(fileHandle) {
                try {
                    const file = await fileHandle.getFile();
                    this.state.clipboard = {
                        action: 'cut',
                        fileHandle: fileHandle,
                        file: file
                    };
                } catch (error) {
                    console.error('Ошибка при вырезании файла:', error);
                    this.showError('Не удалось вырезать файл', error.message);
                }
            }
            
            async pasteFile() {
                if (!this.state.clipboard || !this.state.currentDirectoryHandle) return;
                
                this.showProgress(`Вставка ${this.state.clipboard.fileHandle.name}...`);
                
                try {
                    const { action, fileHandle, file } = this.state.clipboard;
                    const newFileHandle = await this.state.currentDirectoryHandle.getFileHandle(fileHandle.name, { create: true });
                    const writable = await newFileHandle.createWritable();
                    
                    // Читаем файл по частям для больших файлов
                    const chunkSize = 1024 * 1024; // 1MB
                    const fileSize = file.size;
                    let offset = 0;
                    
                    while (offset < fileSize) {
                        const chunk = file.slice(offset, offset + chunkSize);
                        const chunkData = await chunk.arrayBuffer();
                        await writable.write(chunkData);
                        offset += chunkSize;
                        
                        const progress = Math.round((offset / fileSize) * 100);
                        this.updateProgress(progress, `Вставка: ${fileHandle.name} (${progress}%)`);
                    }
                    
                    await writable.close();
                    
                    if (action === 'cut') {
                        await fileHandle.remove();
                    }
                    
                    this.hideProgress();
                    await this.listFiles(this.state.currentDirectoryHandle);
                    this.showNotification('Файл успешно вставлен', 'success');
                } catch (error) {
                    console.error('Ошибка при вставке файла:', error);
                    this.hideProgress();
                    this.showError('Не удалось вставить файл', error.message);
                }
            }
            
            async deleteFile(fileHandle) {
                try {
                    if (!this.state.settings.confirmDeletion || confirm(`Вы уверены, что хотите удалить "${fileHandle.name}"?`)) {
                        await this.state.currentDirectoryHandle.removeEntry(fileHandle.name);
                        await this.listFiles(this.state.currentDirectoryHandle);
                        this.showNotification('Файл удален', 'success');
                    }
                } catch (error) {
                    console.error('Ошибка при удалении файла:', error);
                    this.showError('Не удалось удалить файл', error.message);
                }
            }
            
            async renameFile(fileHandle) {
                const newName = prompt('Введите новое имя файла:', fileHandle.name);
                if (newName && newName !== fileHandle.name) {
                    try {
                        const file = await fileHandle.getFile();
                        const newFileHandle = await this.state.currentDirectoryHandle.getFileHandle(newName, { create: true });
                        const writable = await newFileHandle.createWritable();
                        await writable.write(file);
                        await writable.close();
                        
                        await this.state.currentDirectoryHandle.removeEntry(fileHandle.name);
                        await this.listFiles(this.state.currentDirectoryHandle);
                        this.showNotification('Файл переименован', 'success');
                    } catch (error) {
                        console.error('Ошибка при переименовании файла:', error);
                        this.showError('Не удалось переименовать файл', error.message);
                    }
                }
            }
            
            showFileProperties(fileItem) {
                const fileType = this.getFileType(fileItem.name);
                const iconClass = this.getFileIconClass(fileType, fileItem.name);
                
                const modal = document.createElement('div');
                modal.className = 'modal active';
                modal.innerHTML = `
                    <div class="modal-content">
                        <h3>Свойства файла</h3>
                        <div class="info-grid">
                            <div class="info-card">
                                <h4>Основные</h4>
                                <p><strong>Имя:</strong> ${fileItem.name}</p>
                                <p><strong>Тип:</strong> ${fileType}</p>
                                <p><strong>Размер:</strong> ${this.formatFileSize(fileItem.size)}</p>
                                <p><strong>Путь:</strong> ${this.state.currentPath}/${fileItem.name}</p>
                            </div>
                            <div class="info-card">
                                <h4>Дополнительно</h4>
                                <p><strong>Изменен:</strong> ${new Date(fileItem.modified).toLocaleString()}</p>
                                <p><strong>Иконка:</strong> <i class="fas ${iconClass}"></i></p>
                                <p><strong>Расширение:</strong> ${fileItem.name.split('.').pop() || 'нет'}</p>
                            </div>
                        </div>
                        <button class="modal-btn" id="closePropertiesModal">Закрыть</button>
                    </div>
                `;
                
                document.body.appendChild(modal);
                
                modal.querySelector('#closePropertiesModal').addEventListener('click', () => {
                    modal.remove();
                });
            }
            
            getFileType(filename) {
                const extension = filename.split('.').pop().toLowerCase();
                const fileTypes = {
                    // Изображения
                    'jpg': 'image', 'jpeg': 'image', 'png': 'image', 'gif': 'image', 'webp': 'image', 'svg': 'image', 'bmp': 'image', 'ico': 'image',
                    // Документы
                    'pdf': 'pdf', 'doc': 'word', 'docx': 'word', 'xls': 'excel', 'xlsx': 'excel', 'ppt': 'powerpoint', 'pptx': 'powerpoint',
                    'txt': 'text', 'rtf': 'text', 'md': 'text', 'csv': 'text',
                    // Архивы
                    'zip': 'archive', 'rar': 'archive', '7z': 'archive', 'tar': 'archive', 'gz': 'archive',
                    // Код
                    'js': 'code', 'html': 'code', 'css': 'code', 'json': 'code', 'php': 'code', 'py': 'code', 'java': 'code', 'cpp': 'code', 'h': 'code', 'cs': 'code',
                    // Аудио
                    'mp3': 'audio', 'wav': 'audio', 'ogg': 'audio', 'flac': 'audio', 'aac': 'audio',
                    // Видео
                    'mp4': 'video', 'avi': 'video', 'mov': 'video', 'mkv': 'video', 'flv': 'video', 'wmv': 'video',
                    // Исполняемые файлы
                    'exe': 'executable', 'msi': 'executable', 'bat': 'executable', 'cmd': 'executable', 'sh': 'executable',
                    // Системные файлы
                    'ini': 'ini', 'cfg': 'ini', 'conf': 'ini', 'sys': 'system', 'dll': 'system', 'inf': 'system', 'pdb': 'system',
                    // Торренты
                    'torrent': 'torrent',
                    // Ярлыки
                    'lnk': 'shortcut', 'url': 'shortcut',
                    // Другие
                    'log': 'text', 'xml': 'code', 'yml': 'code', 'yaml': 'code', 'dat': 'file'
                };
                
                return fileTypes[extension] || 'file';
            }
            
            getFileIconClass(fileType, filename = '') {
                const extension = filename.split('.').pop().toLowerCase();
                const icons = {
                    'image': 'fa-file-image',
                    'pdf': 'fa-file-pdf',
                    'word': 'fa-file-word',
                    'excel': 'fa-file-excel',
                    'powerpoint': 'fa-file-powerpoint',
                    'text': 'fa-file-alt',
                    'archive': 'fa-file-archive',
                    'code': 'fa-file-code',
                    'audio': 'fa-file-audio',
                    'video': 'fa-file-video',
                    'executable': 'fa-file-code',
                    'file': 'fa-file',
                    'directory': 'fa-folder',
                    'ini': 'fa-cog',
                    'torrent': 'fa-magnet',
                    'system': 'fa-cogs',
                    'log': 'fa-file-alt',
                    'shortcut': 'fa-shortcut'
                };
                
                // Специальные иконки для определенных расширений
                if (extension === 'html') return 'fa-file-code';
                if (extension === 'css') return 'fa-file-code';
                if (extension === 'js') return 'fa-file-code';
                if (extension === 'exe') return 'fa-cogs';
                if (extension === 'msi') return 'fa-cogs';
                if (extension === 'bat') return 'fa-terminal';
                if (extension === 'cmd') return 'fa-terminal';
                if (extension === 'sh') return 'fa-terminal';
                if (extension === 'log') return 'fa-file-alt';
                if (extension === 'xml') return 'fa-file-code';
                if (extension === 'yml' || extension === 'yaml') return 'fa-file-code';
                if (extension === 'lnk' || extension === 'url') return 'fa-shortcut';
                
                return icons[fileType] || 'fa-file';
            }
            
            formatFileSize(bytes) {
                if (bytes === 0) return '0 Bytes';
                const k = 1024;
                const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
            }
            
            async showFilePreview(fileHandle, file) {
                this.closeFilePreview();
                
                if (!this.state.settings.showPreview) return;
                
                this.previewPanel.classList.remove('hidden');
                this.state.previewHidden = false;
                this.previewContent.innerHTML = '<div class="loading">Загрузка...</div>';
                this.fileInfo.innerHTML = '';
                
                try {
                    const fileType = this.getFileType(fileHandle.name);
                    const iconClass = this.getFileIconClass(fileType, fileHandle.name);
                    
                    this.fileInfo.innerHTML = `
                        <div class="info-row">
                            <span class="info-label">Имя:</span>
                            <span>${fileHandle.name}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Тип:</span>
                            <span>${fileType}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Размер:</span>
                            <span>${this.formatFileSize(file.size)}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Изменен:</span>
                            <span>${new Date(file.lastModified).toLocaleString()}</span>
                        </div>
                    `;
                    
                    if (fileType === 'image') {
                        const img = document.createElement('img');
                        img.src = URL.createObjectURL(file);
                        img.alt = fileHandle.name;
                        img.style.cursor = 'zoom-in';
                        img.addEventListener('click', () => this.showFullScreenImage(img.src));
                        
                        this.previewContent.innerHTML = '';
                        this.previewContent.appendChild(img);
                        
                        this.state.previewHandles.set('currentImage', img);
                    } 
                    else if (fileType === 'text' || fileType === 'code' || fileType === 'ini' || fileType === 'log') {
                        const text = await file.text();
                        const pre = document.createElement('pre');
                        pre.className = 'text-preview';
                        pre.textContent = text;
                        
                        this.previewContent.innerHTML = '';
                        this.previewContent.appendChild(pre);
                    }
                    else if (fileType === 'audio') {
                        const audio = document.createElement('audio');
                        audio.src = URL.createObjectURL(file);
                        audio.controls = true;
                        audio.className = 'audio-player';
                        this.previewContent.innerHTML = '';
                        this.previewContent.appendChild(audio);
                        
                        this.state.previewHandles.set('currentAudio', audio);
                    }
                    else if (fileType === 'video') {
                        const video = document.createElement('video');
                        video.src = URL.createObjectURL(file);
                        video.controls = true;
                        video.className = 'video-player';
                        this.previewContent.innerHTML = '';
                        this.previewContent.appendChild(video);
                        
                        this.state.previewHandles.set('currentVideo', video);
                    }
                    else if (fileType === 'pdf') {
                        const container = document.createElement('div');
                        container.className = 'pdf-viewer-container';
                        
                        const pdfContainer = document.createElement('div');
                        pdfContainer.className = 'pdf-viewer';
                        container.appendChild(pdfContainer);
                        
                        this.previewContent.innerHTML = '';
                        this.previewContent.appendChild(container);
                        
                        const arrayBuffer = await file.arrayBuffer();
                        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
                        
                        const page = await pdf.getPage(1);
                        const viewport = page.getViewport({ scale: 1.0 });
                        
                        const canvas = document.createElement('canvas');
                        const context = canvas.getContext('2d');
                        canvas.height = viewport.height;
                        canvas.width = viewport.width;
                        
                        await page.render({
                            canvasContext: context,
                            viewport: viewport
                        }).promise;
                        
                        pdfContainer.appendChild(canvas);
                        
                        this.state.previewHandles.set('currentPdf', { pdf, container });
                    }
                    else if (fileType === 'archive') {
                        const container = document.createElement('div');
                        container.className = 'zip-preview';
                        
                        try {
                            const arrayBuffer = await file.arrayBuffer();
                            const zip = await JSZip.loadAsync(arrayBuffer);
                            
                            const fileList = document.createElement('ul');
                            fileList.className = 'zip-file-list';
                            
                            let totalSize = 0;
                            let fileCount = 0;
                            
                            zip.forEach((relativePath, zipEntry) => {
                                if (!zipEntry.dir) {
                                    const listItem = document.createElement('li');
                                    listItem.className = 'zip-file-item';
                                    listItem.innerHTML = `
                                        <span class="zip-file-name">${relativePath}</span>
                                        <span class="zip-file-size">${this.formatFileSize(zipEntry._data.uncompressedSize)}</span>
                                    `;
                                    fileList.appendChild(listItem);
                                    
                                    totalSize += zipEntry._data.uncompressedSize;
                                    fileCount++;
                                }
                            });
                            
                            const header = document.createElement('div');
                            header.innerHTML = `<h4>Содержимое архива (${fileCount} файлов, ${this.formatFileSize(totalSize)})</h4>`;
                            container.appendChild(header);
                            container.appendChild(fileList);
                        } catch (error) {
                            container.innerHTML = '<p>Не удалось прочитать содержимое архива</p>';
                        }
                        
                        this.previewContent.innerHTML = '';
                        this.previewContent.appendChild(container);
                    }
                    else if (fileType === 'executable' || fileType === 'system') {
                        const container = document.createElement('div');
                        container.className = 'system-file-preview';
                        container.innerHTML = `
                            <i class="fas ${iconClass} fa-5x"></i>
                            <h3>${fileHandle.name}</h3>
                            <p>${fileType === 'executable' ? 'Исполняемый файл' : 'Системный файл'}</p>
                            <p>Размер: ${this.formatFileSize(file.size)}</p>
                            <button class="run-code-btn" id="runFileBtn">${fileType === 'executable' ? 'Запустить файл' : 'Просмотреть содержимое'}</button>
                        `;
                        
                        this.previewContent.innerHTML = '';
                        this.previewContent.appendChild(container);
                        
                        container.querySelector('#runFileBtn').addEventListener('click', () => {
                            if (this.state.settings.confirmExecutable) {
                                this.state.currentExecutable = { handle: fileHandle, file };
                                this.executableModal.classList.add('active');
                            } else {
                                this.runFile(fileHandle, file);
                            }
                        });
                    }
                    else if (fileType === 'torrent') {
                        const container = document.createElement('div');
                        container.className = 'system-file-preview';
                        container.innerHTML = `
                            <i class="fas ${iconClass} fa-5x"></i>
                            <h3>${fileHandle.name}</h3>
                            <p>Торрент-файл</p>
                            <p>Размер: ${this.formatFileSize(file.size)}</p>
                        `;
                        
                        this.previewContent.innerHTML = '';
                        this.previewContent.appendChild(container);
                    }
                    else if (fileType === 'shortcut') {
                        const container = document.createElement('div');
                        container.className = 'shortcut-preview';
                        
                        try {
                            const text = await file.text();
                            const urlMatch = text.match(/URL=(.*)/i);
                            const pathMatch = text.match(/Path=(.*)/i);
                            
                            let target = 'Не удалось определить цель';
                            if (urlMatch && urlMatch[1]) {
                                target = urlMatch[1];
                            } else if (pathMatch && pathMatch[1]) {
                                target = pathMatch[1];
                            }
                            
                            container.innerHTML = `
                                <i class="fas ${iconClass} fa-5x"></i>
                                <h3>${fileHandle.name}</h3>
                                <p>Ярлык</p>
                                <p>Размер: ${this.formatFileSize(file.size)}</p>
                                <div class="shortcut-target">
                                    <strong>Цель:</strong> ${target}
                                </div>
                                <button class="run-code-btn" id="openShortcutBtn">Открыть ярлык</button>
                            `;
                            
                            container.querySelector('#openShortcutBtn').addEventListener('click', () => {
                                this.handleShortcut(file);
                            });
                        } catch (error) {
                            container.innerHTML = `
                                <i class="fas ${iconClass} fa-5x"></i>
                                <h3>${fileHandle.name}</h3>
                                <p>Ярлык</p>
                                <p>Размер: ${this.formatFileSize(file.size)}</p>
                                <p>Не удалось прочитать содержимое ярлыка</p>
                            `;
                        }
                        
                        this.previewContent.innerHTML = '';
                        this.previewContent.appendChild(container);
                    }
                    else {
                        const container = document.createElement('div');
                        container.className = 'system-file-preview';
                        container.innerHTML = `
                            <i class="fas ${iconClass} fa-5x"></i>
                            <h3>${fileHandle.name}</h3>
                            <p>Тип файла: ${fileType}</p>
                            <p>Размер: ${this.formatFileSize(file.size)}</p>
                        `;
                        
                        this.previewContent.innerHTML = '';
                        this.previewContent.appendChild(container);
                    }
                } catch (error) {
                    console.error('Ошибка при предпросмотре файла:', error);
                    this.previewContent.innerHTML = '<div class="error">Не удалось загрузить файл</div>';
                }
            }
            
            showFullScreenImage(src) {
                const modal = document.createElement('div');
                modal.className = 'image-modal active';
                modal.innerHTML = `
                    <img src="${src}" alt="Full screen preview">
                    <div class="image-modal-close"><i class="fas fa-times"></i></div>
                `;
                
                document.body.appendChild(modal);
                
                const img = modal.querySelector('img');
                img.addEventListener('click', (e) => {
                    if (e.target.classList.contains('zoomed')) {
                        img.classList.remove('zoomed');
                    } else {
                        img.classList.add('zoomed');
                    }
                });
                
                modal.addEventListener('click', (e) => {
                    if (e.target.classList.contains('image-modal') || e.target.closest('.image-modal-close')) {
                        modal.remove();
                    }
                });
            }
            
            closeFilePreview() {
                this.state.previewHandles.forEach((value, key) => {
                    if (key.startsWith('current')) {
                        if (value.src) {
                            URL.revokeObjectURL(value.src);
                        } else if (value.pdf) {
                            value.pdf.destroy();
                        }
                    }
                });
                
                this.state.previewHandles.clear();
            }
            
            async updateStorageInfo() {
                // Убрали информацию о хранилище, так как она не всегда доступна и не очень полезна
                this.selectedInfo.textContent = 'Готов';
            }
            
            async updateFolderStorageInfo(directoryHandle) {
                try {
                    let totalSize = 0;
                    let fileCount = 0;
                    let folderCount = 0;
                    
                    const calculateSize = async (dirHandle) => {
                        for await (const entry of dirHandle.values()) {
                            if (entry.kind === 'file') {
                                const file = await entry.getFile();
                                totalSize += file.size;
                                fileCount++;
                            } else if (entry.kind === 'directory') {
                                folderCount++;
                                await calculateSize(entry);
                            }
                        }
                    };
                    
                    await calculateSize(directoryHandle);
                    
                    this.selectedInfo.textContent = `Файлов: ${fileCount} | Папок: ${folderCount} | Размер: ${this.formatFileSize(totalSize)}`;
                } catch (error) {
                    console.error('Ошибка при вычислении размера папки:', error);
                    this.selectedInfo.textContent = `Не удалось вычислить размер папки`;
                }
            }
            
            updateSelectedInfo(count) {
                if (count > 0) {
                    this.selectedInfo.textContent = `Выбрано: ${count} элементов`;
                } else if (this.state.currentDirectoryHandle) {
                    this.updateFolderStorageInfo(this.state.currentDirectoryHandle);
                }
            }
            
            highlightSearchResults() {
                let foundCount = 0;
                
                const fileItems = this.filesContainer.querySelectorAll('.file-item');
                fileItems.forEach(item => {
                    const fileName = item.querySelector('.file-name').textContent.toLowerCase();
                    if (fileName.includes(this.state.searchQuery)) {
                        item.classList.add('highlight');
                        foundCount++;
                    } else {
                        item.classList.remove('highlight');
                    }
                });
                
                this.updateSelectedInfo(foundCount);
            }
            
            clearSearchHighlights() {
                const highlightedItems = this.filesContainer.querySelectorAll('.file-item.highlight');
                highlightedItems.forEach(item => {
                    item.classList.remove('highlight');
                });
                this.updateSelectedInfo(0);
            }
            
            updateSortButtons() {
                const buttons = this.sortOptions.querySelectorAll('.sort-btn');
                buttons.forEach(button => {
                    button.classList.remove('active');
                    if (button.dataset.sort === this.state.currentSort.field) {
                        button.classList.add('active');
                        const icon = button.querySelector('i');
                        if (icon) {
                            if (button.dataset.sort === 'name') {
                                icon.className = this.state.currentSort.order === 'asc' ? 
                                    'fas fa-sort-alpha-down' : 'fas fa-sort-alpha-down-alt';
                            } else if (button.dataset.sort === 'size') {
                                icon.className = this.state.currentSort.order === 'asc' ? 
                                    'fas fa-sort-numeric-down' : 'fas fa-sort-numeric-down-alt';
                            } else if (button.dataset.sort === 'date') {
                                icon.className = this.state.currentSort.order === 'asc' ? 
                                    'fas fa-sort-numeric-down' : 'fas fa-sort-numeric-down-alt';
                            } else if (button.dataset.sort === 'type') {
                                icon.className = this.state.currentSort.order === 'asc' ? 
                                    'fas fa-sort-alpha-down' : 'fas fa-sort-alpha-down-alt';
                            }
                        }
                    }
                });
            }
            
            showError(title, message) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error';
                errorDiv.innerHTML = `
                    <p><strong>${title}</strong></p>
                    <p>${message}</p>
                `;
                this.filesContainer.appendChild(errorDiv);
            }
            
            async getSystemInfo() {
                try {
                    const infoCards = [];
                    
                    infoCards.push(this.createInfoCard('Браузер', `
                        <p><strong>Пользовательский агент:</strong> ${navigator.userAgent}</p>
                        <p><strong>Поддержка File API:</strong> ${!!window.showDirectoryPicker ? 'Да' : 'Нет'}</p>
                        <p><strong>Поддержка LocalStorage:</strong> ${this.testLocalStorage() ? 'Да' : 'Нет'}</p>
                        <p><strong>Онлайн статус:</strong> ${navigator.onLine ? 'Онлайн' : 'Офлайн'}</p>
                    `));
                    
                    if (navigator.deviceMemory) {
                        infoCards.push(this.createInfoCard('Оперативная память', `
                            <p><strong>Доступно RAM:</strong> ${navigator.deviceMemory} GB</p>
                        `));
                    }
                    
                    if (navigator.hardwareConcurrency) {
                        infoCards.push(this.createInfoCard('Процессор', `
                            <p><strong>Количество ядер:</strong> ${navigator.hardwareConcurrency}</p>
                        `));
                    }
                    
                    infoCards.push(this.createInfoCard('Операционная система', `
                        <p><strong>Платформа:</strong> ${navigator.platform}</p>
                        <p><strong>ОС:</strong> ${this.getOSName()}</p>
                        <p><strong>Версия:</strong> ${navigator.userAgent.match(/\(([^)]+)\)/)[1] || 'Неизвестно'}</p>
                    `));
                    
                    this.systemInfoGrid.innerHTML = '';
                    infoCards.forEach(card => this.systemInfoGrid.appendChild(card));
                } catch (error) {
                    console.error('Ошибка при получении информации о системе:', error);
                }
            }
            
            async getDetailedSystemInfo() {
                try {
                    this.systemDetailsOutput.style.display = 'block';
                    this.systemDetailsOutput.innerHTML = 'Получение информации о системе...';
                    
                    setTimeout(() => {
                        const systemInfo = `
Имя хоста: ${navigator.platform || 'Неизвестно'}
Имя ОС: ${this.getOSName()}
Версия ОС: ${navigator.userAgent.match(/\(([^)]+)\)/)[1] || 'Неизвестно'}
Производитель ОС: ${this.getOSVendor()}
Конфигурация ОС: ${navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} ядер` : 'Неизвестно'}
Тип системы: ${navigator.userAgent.includes('Win64') ? 'x64' : 'x86'}
Процессор(ы): ${navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} логических процессоров` : 'Неизвестно'}
Идентификатор BIOS: Недоступно в браузере
Имя домена: Недоступно в браузере
Время загрузки системы: Недоступно в браузере
Общий объем физической памяти: ${navigator.deviceMemory ? `${navigator.deviceMemory} GB` : 'Неизвестно'}
Доступно физической памяти: ${navigator.deviceMemory ? `${Math.round(navigator.deviceMemory * 0.8 * 100) / 100} GB` : 'Неизвестно'}
Виртуальная память: Макс. размер: Недоступно в браузере
Виртуальная память: Доступно: Недоступно в браузере
Файл подкачки: Недоступно в браузере
                        `;
                        
                        this.systemDetailsOutput.textContent = systemInfo;
                    }, 1000);
                } catch (error) {
                    console.error('Ошибка при получении детальной информации о системе:', error);
                    this.systemDetailsOutput.textContent = 'Не удалось получить информацию о системе';
                }
            }
            
            getOSName() {
                const userAgent = navigator.userAgent;
                if (userAgent.includes('Windows')) return 'Microsoft Windows';
                if (userAgent.includes('Mac')) return 'Mac OS';
                if (userAgent.includes('Linux')) return 'Linux';
                if (userAgent.includes('Android')) return 'Android';
                if (userAgent.includes('iOS')) return 'iOS';
                return 'Неизвестная ОС';
            }
            
            getOSVendor() {
                const userAgent = navigator.userAgent;
                if (userAgent.includes('Windows')) return 'Microsoft Corporation';
                if (userAgent.includes('Mac')) return 'Apple Inc.';
                return 'Неизвестно';
            }
            
            testLocalStorage() {
                try {
                    const testKey = 'test';
                    localStorage.setItem(testKey, testKey);
                    localStorage.removeItem(testKey);
                    return true;
                } catch (e) {
                    return false;
                }
            }
            
            createInfoCard(title, content) {
                const card = document.createElement('div');
                card.className = 'info-card';
                card.innerHTML = `
                    <h4>${title}</h4>
                    ${content}
                `;
                return card;
            }
            
            async loadSettings() {
                try {
                    const savedSettings = localStorage.getItem('quantumExplorerSettings');
                    if (savedSettings) {
                        const parsedSettings = JSON.parse(savedSettings);
                        
                        if (parsedSettings.settings) {
                            this.state.settings = {
                                ...this.state.settings,
                                ...parsedSettings.settings
                            };
                        }
                        
                        if (parsedSettings.sort) {
                            this.state.currentSort = parsedSettings.sort;
                            this.updateSortButtons();
                        }
                        
                        if (parsedSettings.sidebarCollapsed !== undefined) {
                            this.state.sidebarCollapsed = parsedSettings.sidebarCollapsed;
                            this.sidebar.classList.toggle('collapsed', this.state.sidebarCollapsed);
                            this.sidebarToggle.querySelector('i').className = this.state.sidebarCollapsed ? 
                                'fas fa-chevron-right' : 'fas fa-chevron-left';
                        }
                        
                        this.applyTheme(this.state.settings.theme);
                        
                        if (parsedSettings.settings?.defaultView) {
                            this.setViewMode(parsedSettings.settings.defaultView);
                        }
                        
                        if (parsedSettings.settings?.iconSize) {
                            this.setIconSize(parsedSettings.settings.iconSize);
                        }
                        
                        if (parsedSettings.settings?.showPreview !== undefined) {
                            this.state.previewHidden = !parsedSettings.settings.showPreview;
                            this.previewPanel.classList.toggle('hidden', this.state.previewHidden);
                        }
                    }
                } catch (error) {
                    console.error('Ошибка при загрузке настроек:', error);
                }
            }
            
            saveSettings() {
                try {
                    const settingsToSave = {
                        settings: this.state.settings,
                        sort: this.state.currentSort,
                        lastPath: this.state.currentPath,
                        navigationHistory: this.state.navigationHistory,
                        currentHistoryIndex: this.state.currentHistoryIndex,
                        sidebarCollapsed: this.state.sidebarCollapsed
                    };
                    localStorage.setItem('quantumExplorerSettings', JSON.stringify(settingsToSave));
                } catch (error) {
                    console.error('Ошибка при сохранении настроек:', error);
                }
            }
            
            resetSettings() {
                try {
                    localStorage.removeItem('quantumExplorerSettings');
                    
                    // Сброс настроек к значениям по умолчанию
                    this.state.settings = {
                        theme: 'quantum',
                        defaultView: 'icons',
                        iconSize: 'medium',
                        saveSession: true,
                        showHidden: false,
                        enableHotkeys: true,
                        enableAnimations: true,
                        showPreview: true,
                        confirmDeletion: true,
                        confirmExecutable: true,
                        defaultPath: 'desktop',
                        sortPreference: 'name',
                        autoRefresh: true,
                        showShortcuts: true,
                        language: 'ru'
                    };
                    
                    this.state.currentSort = { field: 'name', order: 'asc' };
                    this.state.sidebarCollapsed = false;
                    
                    // Применение сброшенных настроек
                    this.applyTheme(this.state.settings.theme);
                    this.setViewMode(this.state.settings.defaultView);
                    this.setIconSize(this.state.settings.iconSize);
                    this.sidebar.classList.remove('collapsed');
                    this.sidebarToggle.querySelector('i').className = 'fas fa-chevron-left';
                    this.previewPanel.classList.toggle('hidden', !this.state.settings.showPreview);
                    this.state.previewHidden = !this.state.settings.showPreview;
                    this.updateSortButtons();
                    
                    // Перезагрузка текущей директории
                    if (this.state.currentDirectoryHandle) {
                        this.listFiles(this.state.currentDirectoryHandle);
                    }
                    
                    this.showNotification('Настройки сброшены к значениям по умолчанию', 'success');
                    this.settingsModal.classList.remove('active');
                } catch (error) {
                    console.error('Ошибка при сбросе настроек:', error);
                    this.showNotification('Ошибка при сбросе настроек', 'error');
                }
            }
            
            async restoreLastSession() {
                try {
                    const savedSettings = localStorage.getItem('quantumExplorerSettings');
                    if (savedSettings) {
                        const parsedSettings = JSON.parse(savedSettings);
                        
                        if (parsedSettings.navigationHistory && parsedSettings.currentHistoryIndex !== undefined) {
                            this.state.navigationHistory = parsedSettings.navigationHistory;
                            this.state.currentHistoryIndex = parsedSettings.currentHistoryIndex;
                            this.updateNavButtons();
                        }
                        
                        if (parsedSettings.lastPath && this.state.navigationHistory.length > 0) {
                            const lastItem = this.state.navigationHistory[this.state.currentHistoryIndex];
                            this.state.currentPath = lastItem.path;
                            this.state.currentDirectoryHandle = lastItem.handle;
                            this.state.parentDirectoryHandle = lastItem.parentHandle;
                            
                            this.upBtn.disabled = !this.state.parentDirectoryHandle;
                            this.updatePathNavigation();
                            await this.listFiles(lastItem.handle);
                            await this.updateStorageInfo();
                        }
                    }
                } catch (error) {
                    console.error('Ошибка при восстановлении сессии:', error);
                }
            }
            
            showSettingsModal() {
                document.getElementById('themeSelect').value = this.state.settings.theme;
                document.getElementById('defaultView').value = this.state.settings.defaultView;
                document.getElementById('iconSize').value = this.state.settings.iconSize;
                document.getElementById('saveSession').checked = this.state.settings.saveSession;
                document.getElementById('showHidden').checked = this.state.settings.showHidden;
                document.getElementById('enableHotkeys').checked = this.state.settings.enableHotkeys;
                document.getElementById('enableAnimations').checked = this.state.settings.enableAnimations;
                document.getElementById('showPreview').checked = this.state.settings.showPreview;
                document.getElementById('confirmDeletion').checked = this.state.settings.confirmDeletion;
                document.getElementById('confirmExecutable').checked = this.state.settings.confirmExecutable;
                document.getElementById('autoRefresh').checked = this.state.settings.autoRefresh;
                document.getElementById('showShortcuts').checked = this.state.settings.showShortcuts;
                document.getElementById('defaultPath').value = this.state.settings.defaultPath;
                document.getElementById('sortPreference').value = this.state.settings.sortPreference;
                document.getElementById('languageSelect').value = this.state.settings.language;
                
                this.settingsModal.classList.add('active');
            }
            
            saveSettingsFromForm() {
                this.state.settings = {
                    theme: document.getElementById('themeSelect').value,
                    defaultView: document.getElementById('defaultView').value,
                    iconSize: document.getElementById('iconSize').value,
                    saveSession: document.getElementById('saveSession').checked,
                    showHidden: document.getElementById('showHidden').checked,
                    enableHotkeys: document.getElementById('enableHotkeys').checked,
                    enableAnimations: document.getElementById('enableAnimations').checked,
                    showPreview: document.getElementById('showPreview').checked,
                    confirmDeletion: document.getElementById('confirmDeletion').checked,
                    confirmExecutable: document.getElementById('confirmExecutable').checked,
                    defaultPath: document.getElementById('defaultPath').value,
                    sortPreference: document.getElementById('sortPreference').value,
                    autoRefresh: document.getElementById('autoRefresh').checked,
                    showShortcuts: document.getElementById('showShortcuts').checked,
                    language: document.getElementById('languageSelect').value
                };
                
                this.applyTheme(this.state.settings.theme);
                this.setViewMode(this.state.settings.defaultView);
                this.setIconSize(this.state.settings.iconSize);
                this.previewPanel.classList.toggle('hidden', !this.state.settings.showPreview);
                this.state.previewHidden = !this.state.settings.showPreview;
                
                this.saveSettings();
                this.settingsModal.classList.remove('active');
                this.showNotification('Настройки сохранены', 'success');
            }
            
            applyTheme(theme) {
                document.body.classList.remove('theme-quantum', 'theme-dark', 'theme-light');
                document.body.classList.add(`theme-${theme}`);
            }
        }

        document.addEventListener('DOMContentLoaded', () => {
            const app = new QuantumExplorer();
        });