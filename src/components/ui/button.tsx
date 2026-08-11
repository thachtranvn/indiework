'use client';

/**
 * Shared Button — Figma Components (node 26:7282).
 * Pill shape with size / variant / negative / icon-only axes.
 * Colors use Foundations semantic tokens (--bg-brand-solid, --text-primary, …).
 *
 * Icon pixel sizes (applied to Lucide `size`): md 24 · sm 20 · xs 16.
 */

import Link from 'next/link';
import {
  cloneElement,
  isValidElement,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react';

export type ButtonSize = 'md' | 'sm' | 'xs';
export type ButtonVariant = 'accent' | 'primary' | 'secondary' | 'tertiary' | 'inline';

/** Lucide icon size per button size axis. */
export const BUTTON_ICON_PX: Record<ButtonSize, number> = {
  md: 24,
  sm: 20,
  xs: 16,
};

type SharedProps = {
  /** Visual hierarchy. Default `accent` (brand fill). */
  variant?: ButtonVariant;
  /** Control height — md 44 · sm 36 · xs 28. Icons: 24 · 20 · 16. Default `sm`. */
  size?: ButtonSize;
  /** Danger / destructive palette. */
  negative?: boolean;
  /** Circular icon-only control (uses `leftIcon` or `children`). */
  iconOnly?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children?: ReactNode;
  className?: string;
  disabled?: boolean;
};

export type ButtonAsButtonProps = SharedProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className' | 'disabled'> & {
    href?: undefined;
    download?: undefined;
    /** Native button type; defaults to `button`. */
    type?: ButtonHTMLAttributes<HTMLButtonElement>['type'];
  };

export type ButtonAsLinkProps = SharedProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children' | 'className'> & {
    /** When set, renders a link with the same visual styles. */
    href: string;
    download?: string | boolean;
    type?: undefined;
  };

export type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps;

/** Set Lucide `size` so stroke matches the button size slot. */
function withIconSize(node: ReactNode, px: number): ReactNode {
  if (!isValidElement(node)) return node;
  return cloneElement(node as ReactElement<{ size?: number }>, { size: px });
}

/** Inner label / icon layout shared by button and link renders. */
function ButtonContent({
  iconOnly,
  iconPx,
  leftIcon,
  rightIcon,
  children,
}: {
  iconOnly: boolean;
  iconPx: number;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children?: ReactNode;
}) {
  if (iconOnly) {
    const icon = leftIcon != null ? withIconSize(leftIcon, iconPx) : withIconSize(children, iconPx);
    return (
      <>
        <span className="iw-btn-icon">{icon}</span>
        {/* Badge / indicator (e.g. tool-dot) when icon is passed via leftIcon. */}
        {leftIcon != null && children != null && children !== false ? children : null}
      </>
    );
  }
  return (
    <>
      {leftIcon != null && <span className="iw-btn-icon">{withIconSize(leftIcon, iconPx)}</span>}
      {children != null && children !== false && <span className="iw-btn-label">{children}</span>}
      {rightIcon != null && <span className="iw-btn-icon">{withIconSize(rightIcon, iconPx)}</span>}
    </>
  );
}

/** True when `href` is an in-app path that should use Next.js client navigation. */
function isAppPath(href: string): boolean {
  return href.startsWith('/') && !href.startsWith('//');
}

/** App-wide action button matching the redesign component set. */
export function Button({
  variant = 'accent',
  size = 'sm',
  negative = false,
  iconOnly = false,
  leftIcon,
  rightIcon,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const classes = ['iw-btn', className].filter(Boolean).join(' ');
  const iconPx = BUTTON_ICON_PX[size];
  const content = (
    <ButtonContent iconOnly={iconOnly} iconPx={iconPx} leftIcon={leftIcon} rightIcon={rightIcon}>
      {children}
    </ButtonContent>
  );
  const dataAttrs = {
    className: classes,
    'data-size': size,
    'data-variant': variant,
    'data-negative': negative ? ('' as const) : undefined,
    'data-icon-only': iconOnly ? ('' as const) : undefined,
  };

  if ('href' in rest && rest.href) {
    const { href, download, onClick, ...linkRest } = rest;
    const handleClick: AnchorHTMLAttributes<HTMLAnchorElement>['onClick'] = (e) => {
      if (disabled) {
        e.preventDefault();
        return;
      }
      onClick?.(e);
    };

    if (isAppPath(href) && download == null) {
      return (
        <Link
          href={href}
          aria-disabled={disabled || undefined}
          tabIndex={disabled ? -1 : undefined}
          onClick={handleClick}
          {...dataAttrs}
          {...linkRest}
        >
          {content}
        </Link>
      );
    }

    return (
      <a
        href={disabled ? undefined : href}
        download={download}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : undefined}
        onClick={handleClick}
        {...dataAttrs}
        {...linkRest}
      >
        {content}
      </a>
    );
  }

  const { type = 'button', ...buttonRest } = rest as ButtonAsButtonProps;
  return (
    <button type={type} disabled={disabled} {...dataAttrs} {...buttonRest}>
      {content}
    </button>
  );
}
