import { useUser } from "lib/authenticate";
import { useState, useRef, Fragment } from "react";
import { useToasts } from "components/toasts";
import styles from "./avatar.module.css";
import cn from "clsx";
import useSWR, { mutate } from "swr";
import Tooltip from "components/tooltip";
import Image from "next/image";

export default function Avatar({
  className,
  size,
  id,
  loading,
  onClick,
  disabled,
  label,
  skeleton,
}) {
  const Wrapper = label ? Tooltip : Fragment;
  const wrapperProps = label ? { label } : {};

  return (
    <Wrapper {...wrapperProps}>
      <div
        className={cn(styles.avatar, className, {
          [styles.disabled]: disabled || !Boolean(onClick),
        })}
        onClick={onClick}
        style={{ "--size": size }}
      >
        {!loading && !skeleton && (
          <Image
            width={size}
            height={size}
            alt="User's avatar"
            src={
              id
                ? `${process.env.NEXT_PUBLIC_S3_URL}/${id}`
                : "/static/default-avatar-20200904.svg"
            }
          />
        )}
      </div>
    </Wrapper>
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
    const file = e.target?.files?.[0];

    if (!file) {
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("newProfilePic", file);

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
        label="Új profilkép feltöltése"
      />
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
