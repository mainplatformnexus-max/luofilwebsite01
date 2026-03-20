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

  const handleClick = () => {
    if (ctaLink) window.location.href = ctaLink;
  };

  return (
    <div className="w-full my-3 md:my-5 px-2 md:px-4 cursor-pointer" onClick={handleClick}>
      <div className="w-full rounded-xl overflow-hidden bg-black">
        {imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt={title || "Advertisement"}
              className="w-full block"
              referrerPolicy="no-referrer"
            />
            {hasText && (
              <div
                className="w-full flex items-center justify-between gap-2 px-3 py-2 md:px-4 md:py-2.5"
                style={{ background: "#111116" }}
              >
                <div className="flex-1 min-w-0">
                  {title && (
                    <p className="text-white font-bold text-[11px] md:text-sm leading-tight truncate">{title}</p>
                  )}
                  {subtitle && (
                    <p className="text-white/55 font-medium text-[10px] md:text-xs mt-0.5 truncate">{subtitle}</p>
                  )}
                </div>
                {ctaText && (
                  <a
                    href={ctaLink || "#"}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-shrink-0 px-3 py-1 md:px-4 md:py-1.5 rounded-lg font-bold text-[10px] md:text-xs text-black"
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
            className="w-full flex items-center justify-between px-4 py-5 gap-3"
            style={{ background: "linear-gradient(135deg, #1a1c22 0%, #23252b 50%, #1a1c22 100%)" }}
          >
            <div className="flex-1 min-w-0">
              {title && <p className="text-white font-bold text-xs md:text-sm">{title}</p>}
              {subtitle && <p className="text-white/55 text-[10px] md:text-xs mt-0.5">{subtitle}</p>}
            </div>
            {ctaText && (
              <a
                href={ctaLink || "#"}
                onClick={(e) => e.stopPropagation()}
                className="flex-shrink-0 px-3 py-1.5 rounded-lg font-bold text-[10px] md:text-xs text-black"
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
