import * as Yup from "yup";

export const UserProfileSchema = Yup.object().shape({
  bio: Yup.string().max(36, "Maximum 36 karakter"),
});

export function getAnswerSchema(isEditing) {
  if (isEditing) {
    return Yup.object().shape({
      body: Yup.string()
        .required("Üresen ne maradjon, arra ott a törlés")
        .max(15000, "Ez így már túl hosszú"),
    });
  }

  return Yup.object().shape({
    body: Yup.string().max(15000, "Ez így már túl hosszú"),
  });
}

export const QuestionSchema = Yup.object().shape({
  title: Yup.string()
    .required("Cím nélkül nem fog menni")
    .max(64, "Ez egy picit hosszú lett"),
  body: Yup.string()
    .required("Valamit azért írjunk ide is kolléga")
    .max(15000, "Egyezzünk meg 15000 karakterben"),
  topics: Yup.array()
    .of(
      Yup.string()
        .required("Témát is tessék választani")
        .matches(
          "^[a-z0-9-]*$",
          "Csak kisbetüket, számokat és kötőjelet tartalmazhat a téma neve"
        )
        .max(16, "Ez így túl hosszúkás")
    )
    .required("Témát is tessék választani")
    .min(1, "Legalább egy témát adj meg")
    .max(5, "Maximum 5 témát választhatsz"),
});
