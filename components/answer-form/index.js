import Textarea from "components/textarea";
import Button from "components/button";
import styles from "./answer-form.module.css";
import { getAnswerSchema } from "lib/schemas";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

const validationSchema = getAnswerSchema();

export default function AnswerForm({ onSubmit }) {
  const { register, handleSubmit, errors, formState, reset } = useForm({
    defaultValues: { body: "" },
    resolver: yupResolver(validationSchema),
    mode: "onChange",
  });
  const { isDirty, isValid, isSubmitting } = formState;

  async function submitThenReset(values) {
    await onSubmit(values);
    reset();
  }

  return (
    <form onSubmit={handleSubmit(submitThenReset)} className={styles.root}>
      <Textarea
        name="body"
        placeholder="Írd be a válaszod..."
        minRows={1}
        maxRows={5}
        ref={register}
        error={errors?.body?.message}
      />
      <Button
        type="submit"
        disabled={isSubmitting || !(isValid && isDirty)}
        loading={isSubmitting}
        inverted
        className={isDirty ? styles.showOnMobile : null}
      >
        Válaszolás
      </Button>
    </form>
  );
}
