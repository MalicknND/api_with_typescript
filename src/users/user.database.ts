// Import des modules et interfaces nécessaires
import { User, UnitUser, Users } from "./user.interface";
import bcrypt from "bcryptjs";
import { v4 as random } from "uuid";
import fs from "fs";

// Déclaration d'une variable pour stocker les utilisateurs
let users: Users = loadUsers();

// Fonction pour charger les utilisateurs à partir d'un fichier JSON
function loadUsers(): Users {
  try {
    const data = fs.readFileSync("./users.json", "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.log(`Error ${error}`);
    return {};
  }
}

// Fonction pour sauvegarder les utilisateurs dans un fichier JSON
function saveUsers() {
  try {
    fs.writeFileSync("./users.json", JSON.stringify(users), "utf-8");
    console.log(`User saved successfully!`);
  } catch (error) {
    console.log(`Error : ${error}`);
  }
}

// Fonction pour récupérer tous les utilisateurs
export const findAll = async (): Promise<UnitUser[]> => Object.values(users);

// Fonction pour récupérer un utilisateur par son ID
export const findOne = async (id: string): Promise<UnitUser> => users[id];

// Fonction pour créer un nouvel utilisateur
export const create = async (userData: UnitUser): Promise<UnitUser | null> => {
  // Génération d'un ID unique pour l'utilisateur
  let id = random();

  // Vérification de l'unicité de l'ID généré
  let check_user = await findOne(id);
  while (check_user) {
    id = random();
    check_user = await findOne(id);
  }

  // Hashage du mot de passe avant de l'enregistrer dans la base de données
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(userData.password, salt);

  // Création de l'utilisateur avec l'ID généré et le mot de passe hashé
  const user: UnitUser = {
    id: id,
    username: userData.username,
    email: userData.email,
    password: hashedPassword,
  };

  // Enregistrement de l'utilisateur dans la base de données et sauvegarde
  users[id] = user;
  saveUsers();

  return user;
};

// Fonction pour trouver un utilisateur par son adresse e-mail
export const findByEmail = async (
  user_email: string
): Promise<null | UnitUser> => {
  const allUsers = await findAll();
  const getUser = allUsers.find((result) => user_email === result.email);

  if (!getUser) {
    return null;
  }

  return getUser;
};

// Fonction pour comparer le mot de passe fourni avec celui enregistré pour un utilisateur
export const comparePassword = async (
  email: string,
  supplied_password: string
): Promise<null | UnitUser> => {
  const user = await findByEmail(email);

  if (!user) {
    return null;
  }

  const decryptPassword = await bcrypt.compare(
    supplied_password,
    user!.password
  );

  if (!decryptPassword) {
    return null;
  }

  return user;
};

// Fonction pour mettre à jour les informations d'un utilisateur
export const update = async (
  id: string,
  updateValues: User
): Promise<UnitUser | null> => {
  const userExists = await findOne(id);

  if (!userExists) {
    return null;
  }

  // Si un nouveau mot de passe est fourni, il est hashé avant d'être enregistré
  if (updateValues.password) {
    const salt = await bcrypt.genSalt(10);
    const newPass = await bcrypt.hash(updateValues.password, salt);
    updateValues.password = newPass;
  }

  // Mise à jour des informations de l'utilisateur et sauvegarde
  users[id] = {
    ...userExists,
    ...updateValues,
  };
  saveUsers();

  return users[id];
};

// Fonction pour supprimer un utilisateur
export const remove = async (id: string): Promise<null | void> => {
  const user = await findOne(id);

  if (!user) {
    return null;
  }

  // Suppression de l'utilisateur de la base de données et sauvegarde
  delete users[id];
  saveUsers();
};
