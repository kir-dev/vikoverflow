import { QuestionSchema } from "lib/schemas";

describe("schemas", () => {
  describe("question", () => {
    // this is a regression test for:
    // https://github.com/jquense/yup/issues/1127
    it("should correctly validate topics", async () => {
      // mirroring react-hook-form
      // https://github.com/react-hook-form/resolvers/blob/72a775c32b2af45cf3a9899b5d6dbcc75b83c2d5/src/yup.ts#L47
      const options = {
        abortEarly: false,
      };

      const rest = {
        title: "title",
        body: "body",
      };

      const minError = {
        ...rest,
        topics: [],
      };

      const maxError = {
        ...rest,
        topics: ["topic1", "topic2", "topic3", "topic4", "topic5", "topic6"],
      };

      const valid = {
        ...rest,
        topics: ["topic"],
      };

      await expect(QuestionSchema.validate(rest, options)).rejects.toThrow(
        "Témát is tessék választani"
      );
      await expect(QuestionSchema.validate(minError, options)).rejects.toThrow(
        "Legalább egy témát adj meg"
      );
      await expect(QuestionSchema.validate(maxError, options)).rejects.toThrow(
        "Maximum 5 témát választhatsz"
      );
      await expect(QuestionSchema.validate(valid, options)).resolves.toBe(
        valid
      );
    });
  });
});
