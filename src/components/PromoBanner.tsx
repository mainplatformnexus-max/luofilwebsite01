interface PromoBannerProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  imageUrl?: string;
}

const PromoBanner = ({
  title = "Enjoy the Best Experience",
  subtitle = "on LUO FILM",
  ctaText = "Watch Now",
  ctaLink,
  imageUrl,
}: PromoBannerProps) => (
  <div
    className="w-full my-2 md:my-4 overflow-hidden cursor-pointer relative"
    style={{ height: "56px", background: "linear-gradient(135deg, #1a1c22 0%, #23252b 50%, #1a1c22 100%)" }}
    onClick={() => ctaLink && (window.location.href = ctaLink)}
  >
    {imageUrl && (
      <img
        src={imageUrl}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover"
        referrerPolicy="no-referrer"
      />
    )}
    <div className="absolute inset-0 flex items-center justify-center" style={imageUrl ? { background: "rgba(0,0,0,0.45)" } : undefined}>
      <div className="flex flex-wrap items-center justify-center gap-2 px-4 text-center">
        <span className="text-foreground/80 text-[11px] md:text-sm">{title}</span>
        <span className="text-foreground/80 text-[11px] md:text-sm">{subtitle}</span>
        {ctaText && (
          <span className="text-primary text-[11px] md:text-sm font-bold">{ctaText}</span>
        )}
      </div>
    </div>
  </div>
);

export default PromoBanner;
