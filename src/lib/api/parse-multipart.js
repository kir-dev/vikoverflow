import Busboy from "busboy";

// has to be used with
// export const config = {
//   api: {
//     bodyParser: false,
//   },
// };
export default async function parseMultipart(
  request,
  options = {
    limits: { fileSize: 1024 * 1024 * 5, files: 1 },
  }
) {
  const parsedFields = {};
  const parsedFiles = [];

  const busboy = new Busboy({
    headers: request.headers,
    limits: options.limits,
  });

  await new Promise((resolve, reject) => {
    busboy.on("field", (fieldname, value) => {
      parsedFields[fieldname] = value;
    });

    busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
      const chunks = [];

      file.on("data", (data) => chunks.push(data));

      file.on("limit", () => reject(new Error("file too big")));

      file.on("end", () => {
        parsedFiles.push({
          originalName: filename,
          contentType: mimetype,
          body: Buffer.concat(chunks),
        });
      });
    });

    busboy.on("filesLimit", () => reject(new Error("too many files")));

    busboy.on("finish", resolve);

    request.pipe(busboy);
  });

  return { parsedFields, parsedFiles };
}
