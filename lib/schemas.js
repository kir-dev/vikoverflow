import * as Yup from "yup";

export function getAnswerSchema(isEditing) {
  if (isEditing) {
    return Yup.object().shape({
      body: Yup.string()
        .required("Üresen ne maradjon, arra ott a törlés")
        .max(256, "Ez így már túl hosszú"),
    });
  }

  return Yup.object().shape({
    body: Yup.string().max(256, "Ez így már túl hosszú"),
  });
}

export function getQuestionSchema(isTopicNew) {
  const validationShape = {
    title: Yup.string()
      .required("Cím nélkül nem fog menni")
      .max(64, "Ez egy picit hosszú lett"),
    body: Yup.string()
      .required("Valamit azért írjunk ide is kolléga")
      .max(512, "Egyezzünk meg 512 karakterben"),
    topic: Yup.string()
      .required("Témát is tessék választani")
      .matches("^[a-z0-9-]*$", "Passzolnia kéne erre a regexre: ^[a-z0-9-]*$")
      .max(16, "Ez így túl hosszúkás"),
  };

  if (isTopicNew) {
    validationShape.topicDescription = Yup.string()
      .required("Ha már új témát hozol létre ez kelleni fog")
      .max(64, "Legyen egy picit tömörebb");
  }

  return Yup.object().shape(validationShape);
}
