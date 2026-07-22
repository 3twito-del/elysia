import { permanentRedirect } from "next/navigation";

export default function GiftsRedirectPage() {
  permanentRedirect("/search");
}
