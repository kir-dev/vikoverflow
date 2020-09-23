import { useUser } from "lib/authenticate";
import { useState, useRef, useEffect } from "react";
import { useToasts } from "components/toasts";
import styles from "./avatar.module.css";
import cn from "clsx";
import LoadingDots from "components/loading-dots";
import useSWR, { mutate } from "swr";

export default function Avatar({
  className,
  size,
  id,
  loading,
  onClick,
  disabled,
}) {
  const imgRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    imgRef?.current?.complete && setReady(true);
  }, []);

  return (
    <div
      className={cn(styles.avatar, className, {
        [styles.disabled]: disabled,
      })}
      onClick={onClick}
      style={{ "--size": size }}
    >
      {!loading && (
        <img
          decoding="async"
          loading="lazy"
          importance="low"
          alt="User's avatar"
          className={cn({ [styles.ready]: ready })}
          onLoad={() => setReady(true)}
          ref={imgRef}
          src={
            id
              ? `/api/user/avatar/${id}?size=${size * 2}`
              : "/static/default-avatar-20200904.svg"
          }
        />
      )}
    </div>
  );
}

export function UploadAvatar({ className, size }) {
  const { user } = useUser();
  const { data: userData } = useSWR(user?.id ? `/api/user/${user.id}` : "");
  const hiddenInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const { addToast } = useToasts();

  function handleClick() {
    if (uploading) return;
    hiddenInputRef.current.click();
  }

  async function handleUpload(e) {
    setUploading(true);
    const formData = new FormData();
    formData.append("newProfilePic", e.target.files[0]);

    const res = await fetch("/api/user/avatar", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const { s3Key } = await res.json();
      mutate(
        "/api/user",
        (oldData) => ({ user: { ...oldData.user, avatar: s3Key } }),
        false
      );
      mutate(
        `/api/user/${user.id}`,
        (oldData) => ({ user: { ...oldData?.user, avatar: s3Key } }),
        false
      );
      addToast("Sikeresen megváltoztattad a profilképed");
    } else {
      addToast("Hiba lépett fel a profilképed feltöltése közben", {
        errored: true,
      });
      // TODO clear inputs value to allow retrys
    }
    setUploading(false);
  }

  return (
    <div className={cn(styles.root, className)}>
      <Avatar
        loading={!userData?.user || uploading}
        id={userData?.user?.avatar}
        onClick={handleClick}
        size={size}
        disabled={uploading}
      />
      {uploading && (
        <div className={styles.loadingOverlay}>
          <LoadingDots />
        </div>
      )}
      <input
        className={styles.avatarInput}
        ref={hiddenInputRef}
        onChange={handleUpload}
        type="file"
        accept="image/png,image/jpeg"
      />
    </div>
  );
}
