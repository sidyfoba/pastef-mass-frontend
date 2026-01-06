export type UserProfile = {
  commune: string;
  prenom: string;
  nom: string;
  dateNaissance: string; // YYYY-MM-DD
  phone: string; // read-only in UI
  carteIdentite: string;
  dateExpiration: string; // YYYY-MM-DD
  carteElecteur: boolean;
  nonVote: boolean;
  nonInscrit: boolean;
};

export type MeResponse = {
  phone: string;
  profile?: Partial<UserProfile>;
};
