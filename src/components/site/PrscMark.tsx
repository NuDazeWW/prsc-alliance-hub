import logo from "@/assets/prsc-logo-tag.png.asset.json";
import logoMission from "@/assets/prsc-logo-mission.png.asset.json";
import logoHorizontal from "@/assets/prsc-horizontal-lockup.png.asset.json";

export function PrscMark({
  variant = "tag",
  className,
}: {
  variant?: "tag" | "mission" | "horizontal";
  className?: string;
}) {
  const src = variant === "mission" ? logoMission.url : variant === "horizontal" ? logoHorizontal.url : logo.url;
  return <img src={src} alt="PRSC — Partnership Readiness Standards Council" className={className} loading="lazy" />;
}
