interface PromoBannerProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  imageUrl?: string;
}

const PromoBanner = ({
  title,
  subtitle,
  ctaText,
  ctaLink,
  imageUrl,
}: PromoBannerProps) => {
  const hasText = title || subtitle || ctaText;

  return (
    <div
      className="w-full my-3 md:my-5 px-2 md:px-4 cursor-pointer"
      onClick={() => ctaLink && (window.location.href = ctaLink)}
    >
      <div className="w-full rounded-xl overflow-hidden relative bg-black">
        {imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt={title || "Advertisement"}
              className="w-full block"
              style={{ display: "block", maxHeight: "none" }}
              referrerPolicy="no-referrer"
            />
            {hasText && (
              <div
                className="absolute inset-x-0 bottom-0 px-4 py-4 flex items-end justify-between gap-3"
                style={{ background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.45) 60%, transparent 100%)" }}
              >
                <div className="flex-1 min-w-0">
                  {title && (
                    <p className="text-white font-extrabold text-sm md:text-lg leading-tight drop-shadow-lg">{title}</p>
                  )}
                  {subtitle && (
                    <p className="text-white/80 font-semibold text-xs md:text-sm mt-0.5 drop-shadow">{subtitle}</p>
                  )}
                </div>
                {ctaText && (
                  <a
                    href={ctaLink || "#"}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-shrink-0 px-4 py-2 rounded-lg font-extrabold text-xs md:text-sm text-black shadow-lg"
                    style={{ background: "linear-gradient(135deg, #f59e0b, #ef4444)", whiteSpace: "nowrap" }}
                  >
                    {ctaText}
                  </a>
                )}
              </div>
            )}
          </>
        ) : (
          <div
            className="w-full flex items-center justify-between px-5 py-6 gap-4"
            style={{ background: "linear-gradient(135deg, #1a1c22 0%, #23252b 50%, #1a1c22 100%)" }}
          >
            <div className="flex-1 min-w-0">
              {title && <p className="text-white font-extrabold text-sm md:text-base">{title}</p>}
              {subtitle && <p className="text-white/60 text-xs md:text-sm mt-0.5">{subtitle}</p>}
            </div>
            {ctaText && (
              <a
                href={ctaLink || "#"}
                onClick={(e) => e.stopPropagation()}
                className="flex-shrink-0 px-4 py-2 rounded-lg font-extrabold text-xs md:text-sm text-black"
                style={{ background: "linear-gradient(135deg, #f59e0b, #ef4444)", whiteSpace: "nowrap" }}
              >
                {ctaText}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PromoBanner;
