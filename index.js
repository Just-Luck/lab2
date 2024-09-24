const path = require('path');
const {getAllFilePathsWithExtension, readFile} = require('./fileSystem');
const {readLine} = require('./console');

const files = getFiles(); //?Считываем файлы

console.log('Please, write your command!');
readLine(processCommand); //?Считываем команду

//*Функция для чтения файла и получения имени файла
function getFiles() {
    const filePaths = getAllFilePathsWithExtension(process.cwd(), 'js');
    return filePaths.map(file_path => ({
        fileName: path.basename(file_path),
        content: readFile(file_path)
    }));
}

//*Функция получения опредленного масива TODO
function getTODO(type = 'default', ...params) {
    let todos = [];
    files.forEach(file => { //?Проходимся по всем файлам
        const lines = file.content.split('\n');
        lines.forEach(line => { //?Проходимся по всем строкам
            const todoMatch = line.match(/\/\/ TODO\s+(.*)/);
            if(!todoMatch) return;
            switch (type){
                case 'important': //?Выбираем только TODO с !
                    if(todoMatch[1].slice(-1) === '!') todos.push([todoMatch[1], file.fileName]);
                    break;
                case 'user': //?Выбираем только TODO с автором
                    [username, comment_date, comment] = todoMatch[1].split(';');
                    if(username && comment_date && comment && username.toLowerCase() === params[0][0].toLowerCase()) todos.push([todoMatch[1], file.fileName]);
                    break;
                case 'date': //?Выбираем только TODO с определенной даты
                    [username, comment_date, comment] = todoMatch[1].split(';');
                    if(username && comment_date && comment){
                        comment_date = new Date(comment_date);
                        if(comment_date >= params[0]) todos.push([todoMatch[1], file.fileName]);
                    }
                    break;
                default: //?Собираем все TODO
                    todos.push([todoMatch[1], file.fileName]);
            }
        });
    });
    return todos;
}

//*Функция реагирования на команды
function processCommand(command) {
    const [cmd, ...arg] = command.split(' '); 
    switch (cmd) {
        case 'show': //?Вывод всех логов
            printTODO(getTODO());
            break;
        case 'important': //?Вывод важных логов (!)
            printTODO(getTODO('important'));
            break;
        case 'user': //?Вывод логов с автором
            if(!arg[0]) return console.log('Пример использования user {username}')
                printTODO(getTODO('user', arg));
            break;
        case 'sort': //?Вывод сортированных логов
            if (!arg[0] || (arg[0] != 'importance' && arg[0] != 'user' & arg[0] != 'date')) return console.log('Пример использования sort {importance | user | date}');
            let todos = getTODO('sort', arg);
            if(arg[0] === 'importance'){
                todos.sort((a, b) => (b[0].match(/!/g) || []).length - (a[0].match(/!/g) || []).length);
            } else if (arg[0] === 'user'){
                todos.sort((a, b) => {
                    const username_a = a[0].split(';');
                    const username_b = b[0].split(';');
                    if (username_a.length != 1 && username_b.length != 1) return username_a[0].localeCompare(username_b[0]);
                    if(username_b.length === 1) return -1; 
                    if(username_a.length === 1) return 1; 
                    return 0; 
                });
            } else if (arg[0] === 'date'){
                todos.sort((a, b) => {
                    const date_a = a[0].split(';');
                    const date_b = b[0].split(';');
                    if (date_a.length != 1 && date_b.length != 1){
                        const parsedDateA = new Date(date_a[1]);
                        const parsedDateB = new Date(date_b[1]);
                        return parsedDateB - parsedDateA;
                    };
                    if(date_a.length === 1) return 1; 
                    if(date_b.length === 1) return -1; 
                    return 0; 
                });
            } else return console.log('Пример использования sort {importance | user | date}');
            printTODO(todos);
            break;
        case 'date': //?Вывод логов от опредленной даты
            if (!arg[0]) return console.log('Пример использования date {yyyy[-mm[-dd]]}');
            const inputDate = parseDate(arg[0]);
            if (!inputDate) return console.log('Пример использования: date 2015, date 2016-02, date 2018-03-02');
            printTODO(getTODO('date', inputDate));
            break;
        case 'exit':
            process.exit(0);
            break;
        default:
            console.log('wrong command');
            break;
    }
}

//*Функция для преобразования разных форматов дат в общий
function parseDate(input) {
    const parts = input.split('-').map(Number);
    if (parts.length === 1) return new Date(parts[0], 0, 1);
    else if (parts.length === 2) return new Date(parts[0], parts[1] - 1, 1);
    else if (parts.length === 3) return new Date(parts[0], parts[1] - 1, parts[2]);
    else return null;
}

//*Функция вывода в виде таблицы
function printTODO(arr) {
    const tableData = arr.map(todo => {
        let [user, date, comment] = todo[0].split(';').map(part => part ? part.trim() : '');
        if (!date && !comment)[user, comment] = ['', user];
        const important = comment && comment.includes('!') ? '!' : '';
        const truncate = (str, maxLength) => str.length > maxLength ? str.slice(0, maxLength - 3) + '...' : str;

        return {
            Importance: important,
            User: user ? truncate(user, 10) : '',
            Date: date ? truncate(date, 10) : '',
            Comment: comment ? truncate(comment, 50) : '',
            File_name: todo[1]
        };
    });
    console.table(tableData);
}

// TODO you can do it!