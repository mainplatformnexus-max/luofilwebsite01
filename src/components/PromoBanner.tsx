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
    className="w-full my-3 md:my-5 overflow-hidden rounded-xl cursor-pointer"
    onClick={() => ctaLink && (window.location.href = ctaLink)}
  >
    {imageUrl ? (
      <div className="w-full bg-black flex items-center justify-center" style={{ minHeight: "120px", maxHeight: "220px" }}>
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-auto max-h-[220px] object-contain block"
          referrerPolicy="no-referrer"
        />
      </div>
    ) : (
      <div
        className="w-full flex items-center justify-center px-4 py-6"
        style={{ minHeight: "100px", background: "linear-gradient(135deg, #1a1c22 0%, #23252b 50%, #1a1c22 100%)" }}
      >
        <div className="flex flex-wrap items-center justify-center gap-2 text-center">
          <span className="text-foreground/80 text-sm md:text-base">{title}</span>
          <span className="text-foreground/60 text-sm md:text-base">{subtitle}</span>
          {ctaText && (
            <span className="text-primary text-sm md:text-base font-bold">{ctaText}</span>
          )}
        </div>
      </div>
    )}
  </div>
);

export default PromoBanner;
