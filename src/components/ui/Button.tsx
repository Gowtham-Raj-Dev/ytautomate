"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import Link from "next/link";
import { cx } from "@/lib/utils";
import { Spinner } from "./Spinner";
import styles from "@/styles/Button.module.css";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface BaseProps {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

type ButtonProps = BaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type LinkProps = BaseProps & {
  href: string;
  children: React.ReactNode;
  className?: string;
};

function classes(
  variant: Variant,
  size: Size,
  fullWidth?: boolean,
  extra?: string
) {
  return cx(
    styles.button,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    extra
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    fullWidth,
    iconLeft,
    iconRight,
    className,
    children,
    disabled,
    ...rest
  },
  ref
) {
  return (
    <button
      ref={ref}
      className={classes(variant, size, fullWidth, className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <Spinner size={size === "lg" ? 20 : 16} />
      ) : (
        iconLeft && <span className={styles.icon}>{iconLeft}</span>
      )}
      <span>{children}</span>
      {!loading && iconRight && <span className={styles.icon}>{iconRight}</span>}
    </button>
  );
});

/** Link styled like a Button (for navigation / CTAs). */
export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  children,
}: LinkProps & BaseProps) {
  return (
    <Link href={href} className={classes(variant, size, fullWidth, className)}>
      {children}
    </Link>
  );
}
