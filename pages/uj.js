import { useRouter } from "next/router";
import Form from "components/question-form";
import Layout from "components/layout";
import Head from "next/head";
import { useUser } from "lib/authenticate";
import { mutate } from "swr";
import { useToasts } from "components/toasts";
import { trimSpaces, trimLineBreaks } from "lib/utils";

const AskPage = () => {
  const router = useRouter();
  const { user } = useUser("/belepes");
  const { addToast } = useToasts();
  const initialTopic = router.query.tema;

  const handleSubmit = async (values) => {
    const formData = new FormData();

    for (let key of Object.keys(values)) {
      formData.append(key, values[key]);
    }

    const res = await fetch("/api/questions", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const { id } = await res.json();
      return router.push(`/kerdes/${id}`);
    } else {
      addToast("Hiba lépett fel kérdésed beküldése közben", {
        errored: true,
      });
    }
  };

  return (
    <Layout>
      <Head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
            if (document.cookie.indexOf("logged-in=") === -1) {
              window.location.replace('/belepes')
            }
          `,
          }}
        />
      </Head>

      <Form
        buttonText="Küldés"
        onSubmit={handleSubmit}
        skeleton={!user}
        message="Később van lehetőség módosításokra."
        initialValues={{ topic: initialTopic }}
      />
    </Layout>
  );
};

export default AskPage;
