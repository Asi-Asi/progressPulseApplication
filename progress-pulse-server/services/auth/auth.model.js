import { readFile, writeFile } from 'fs/promises';

export async function validateUser(username, password) {
    let users = await readFile('./data/users.json', 'utf-8');
    users = JSON.parse(users);
    let user = users.find(user => user.username === username && user.password === password);
    return user;
}

export async function addNewUser(username, password, profileImage) {
    let users = await readFile('./data/users.json', 'utf-8');
    users = JSON.parse(users);

    if (users.find(user => user.username === username))
        return false;

    users.push({ username, password, profileImage });
    await writeFile('./data/users.json', JSON.stringify(users));
    return true;
}