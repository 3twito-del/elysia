"use client";

import { useEffect, type AriaRole, type HTMLAttributes } from "react";
import {
  addIcon,
  Icon,
  loadIcons,
  type IconifyIconProps,
} from "@iconify-icon/react";
import arrowDownThin from "@iconify-icons/ph/arrow-down-thin";
import arrowElbowDownLeftThin from "@iconify-icons/ph/arrow-elbow-down-left-thin";
import arrowCounterClockwiseThin from "@iconify-icons/ph/arrow-counter-clockwise-thin";
import arrowLeftThin from "@iconify-icons/ph/arrow-left-thin";
import calendarCheckThin from "@iconify-icons/ph/calendar-check-thin";
import calendarThin from "@iconify-icons/ph/calendar-thin";
import caretDownThin from "@iconify-icons/ph/caret-down-thin";
import caretLeftThin from "@iconify-icons/ph/caret-left-thin";
import caretRightThin from "@iconify-icons/ph/caret-right-thin";
import caretUpThin from "@iconify-icons/ph/caret-up-thin";
import chatCenteredTextThin from "@iconify-icons/ph/chat-centered-text-thin";
import chatCircleTextThin from "@iconify-icons/ph/chat-circle-text-thin";
import checkThin from "@iconify-icons/ph/check-thin";
import checkCircleThin from "@iconify-icons/ph/check-circle-thin";
import circleNotchThin from "@iconify-icons/ph/circle-notch-thin";
import clipboardTextThin from "@iconify-icons/ph/clipboard-text-thin";
import creditCardThin from "@iconify-icons/ph/credit-card-thin";
import diamondThin from "@iconify-icons/ph/diamond-thin";
import downloadSimpleThin from "@iconify-icons/ph/download-simple-thin";
import giftThin from "@iconify-icons/ph/gift-thin";
import heartThin from "@iconify-icons/ph/heart-thin";
import imageThin from "@iconify-icons/ph/image-thin";
import listThin from "@iconify-icons/ph/list-thin";
import lockKeyThin from "@iconify-icons/ph/lock-key-thin";
import magicWandThin from "@iconify-icons/ph/magic-wand-thin";
import magnifyingGlassThin from "@iconify-icons/ph/magnifying-glass-thin";
import mapPinThin from "@iconify-icons/ph/map-pin-thin";
import monitorThin from "@iconify-icons/ph/monitor-thin";
import packageThin from "@iconify-icons/ph/package-thin";
import phoneThin from "@iconify-icons/ph/phone-thin";
import plugsConnectedThin from "@iconify-icons/ph/plugs-connected-thin";
import plusThin from "@iconify-icons/ph/plus-thin";
import rulerThin from "@iconify-icons/ph/ruler-thin";
import shieldCheckThin from "@iconify-icons/ph/shield-check-thin";
import shieldWarningThin from "@iconify-icons/ph/shield-warning-thin";
import shoppingBagThin from "@iconify-icons/ph/shopping-bag-thin";
import signOutThin from "@iconify-icons/ph/sign-out-thin";
import slidersHorizontalThin from "@iconify-icons/ph/sliders-horizontal-thin";
import sparkleThin from "@iconify-icons/ph/sparkle-thin";
import squareThin from "@iconify-icons/ph/square-thin";
import stackThin from "@iconify-icons/ph/stack-thin";
import storefrontThin from "@iconify-icons/ph/storefront-thin";
import truckThin from "@iconify-icons/ph/truck-thin";
import userCircleThin from "@iconify-icons/ph/user-circle-thin";
import warningCircleThin from "@iconify-icons/ph/warning-circle-thin";
import xThin from "@iconify-icons/ph/x-thin";

import { cn } from "~/lib/utils";

export const iconMap = {
  alert: "ph:warning-circle-thin",
  arrowDown: "ph:arrow-down-thin",
  arrowLeft: "ph:arrow-left-thin",
  calendarCheck: "ph:calendar-check-thin",
  calendarDots: "ph:calendar-dots-thin",
  caretDown: "ph:caret-down-thin",
  caretLeft: "ph:caret-left-thin",
  caretRight: "ph:caret-right-thin",
  caretUp: "ph:caret-up-thin",
  chat: "ph:chat-centered-text-thin",
  chatCircle: "ph:chat-circle-text-thin",
  check: "ph:check-thin",
  checkCircle: "ph:check-circle-thin",
  clipboard: "ph:clipboard-text-thin",
  close: "ph:x-thin",
  cornerDownLeft: "ph:arrow-elbow-down-left-thin",
  creditCard: "ph:credit-card-thin",
  diamond: "ph:diamond-thin",
  download: "ph:download-simple-thin",
  gift: "ph:gift-thin",
  heart: "ph:heart-thin",
  image: "ph:image-thin",
  loader: "ph:circle-notch-thin",
  lock: "ph:lock-key-thin",
  magicWand: "ph:magic-wand-thin",
  mapPin: "ph:map-pin-thin",
  menu: "ph:list-thin",
  monitor: "ph:monitor-thin",
  package: "ph:package-thin",
  phone: "ph:phone-thin",
  plug: "ph:plugs-connected-thin",
  plus: "ph:plus-thin",
  return: "ph:arrow-counter-clockwise-thin",
  ruler: "ph:ruler-thin",
  search: "ph:magnifying-glass-thin",
  shieldCheck: "ph:shield-check-thin",
  shieldWarning: "ph:shield-warning-thin",
  shoppingBag: "ph:shopping-bag-thin",
  signOut: "ph:sign-out-thin",
  sliders: "ph:sliders-horizontal-thin",
  sparkle: "ph:sparkle-thin",
  square: "ph:square-thin",
  stack: "ph:stack-thin",
  storefront: "ph:storefront-thin",
  truck: "ph:truck-thin",
  user: "ph:user-circle-thin",
  x: "ph:x-thin",
} as const;

export type IconName = keyof typeof iconMap | (string & {});

const localIcons = {
  "ph:arrow-counter-clockwise-thin": arrowCounterClockwiseThin,
  "ph:arrow-down-thin": arrowDownThin,
  "ph:arrow-elbow-down-left-thin": arrowElbowDownLeftThin,
  "ph:arrow-left-thin": arrowLeftThin,
  "ph:calendar-check-thin": calendarCheckThin,
  "ph:calendar-dots-thin": calendarThin,
  "ph:caret-down-thin": caretDownThin,
  "ph:caret-left-thin": caretLeftThin,
  "ph:caret-right-thin": caretRightThin,
  "ph:caret-up-thin": caretUpThin,
  "ph:chat-centered-text-thin": chatCenteredTextThin,
  "ph:chat-circle-text-thin": chatCircleTextThin,
  "ph:check-circle-thin": checkCircleThin,
  "ph:check-thin": checkThin,
  "ph:circle-notch-thin": circleNotchThin,
  "ph:clipboard-text-thin": clipboardTextThin,
  "ph:credit-card-thin": creditCardThin,
  "ph:diamond-thin": diamondThin,
  "ph:download-simple-thin": downloadSimpleThin,
  "ph:gift-thin": giftThin,
  "ph:heart-thin": heartThin,
  "ph:image-thin": imageThin,
  "ph:list-thin": listThin,
  "ph:lock-key-thin": lockKeyThin,
  "ph:magic-wand-thin": magicWandThin,
  "ph:magnifying-glass-thin": magnifyingGlassThin,
  "ph:map-pin-thin": mapPinThin,
  "ph:monitor-thin": monitorThin,
  "ph:package-thin": packageThin,
  "ph:phone-thin": phoneThin,
  "ph:plugs-connected-thin": plugsConnectedThin,
  "ph:plus-thin": plusThin,
  "ph:ruler-thin": rulerThin,
  "ph:shield-check-thin": shieldCheckThin,
  "ph:shield-warning-thin": shieldWarningThin,
  "ph:shopping-bag-thin": shoppingBagThin,
  "ph:sign-out-thin": signOutThin,
  "ph:sliders-horizontal-thin": slidersHorizontalThin,
  "ph:sparkle-thin": sparkleThin,
  "ph:square-thin": squareThin,
  "ph:stack-thin": stackThin,
  "ph:storefront-thin": storefrontThin,
  "ph:truck-thin": truckThin,
  "ph:user-circle-thin": userCircleThin,
  "ph:warning-circle-thin": warningCircleThin,
  "ph:x-thin": xThin,
} as const;

let localIconsRegistered = false;

function registerLocalIcons() {
  if (localIconsRegistered) return;

  for (const [name, icon] of Object.entries(localIcons)) {
    addIcon(name, icon);
  }

  localIconsRegistered = true;
}

registerLocalIcons();

type AphroditeIconProps = Omit<
  HTMLAttributes<HTMLElement>,
  "aria-hidden" | "aria-label" | "children" | "className" | "role"
> &
  Pick<IconifyIconProps, "height" | "inline" | "rotate" | "width"> & {
    name: IconName;
    className?: string;
    decorative?: boolean;
    label?: string;
    role?: AriaRole;
  };

export function resolveIconName(name: IconName) {
  return Object.prototype.hasOwnProperty.call(iconMap, name)
    ? iconMap[name as keyof typeof iconMap]
    : name;
}

export function AphroditeIcon({
  name,
  className,
  decorative,
  label,
  role,
  ...props
}: AphroditeIconProps) {
  const isAccessible = Boolean(label) && decorative !== true;

  return (
    <Icon
      aria-hidden={isAccessible ? undefined : true}
      aria-label={isAccessible ? label : undefined}
      className={cn(
        "inline-block size-4 shrink-0 align-[-0.125em] text-current",
        className,
      )}
      icon={resolveIconName(name)}
      role={role ?? (isAccessible ? "img" : undefined)}
      {...props}
    />
  );
}

export function IconPreloader() {
  useEffect(() => {
    registerLocalIcons();
    loadIcons(Array.from(new Set(Object.values(iconMap))));
  }, []);

  return null;
}
