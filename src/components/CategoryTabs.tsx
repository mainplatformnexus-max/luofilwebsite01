const categories = [
  "All Videos", "Chinese Mainland", "South Korea", "Thailand", "Taiwan",
  "Japan", "Malaysia", "Anime", "Youth", "Mystery", "LGBT", "Costume",
  "Romance", "Sweet Love", "Startups"
];

interface CategoryTabsProps {
  selected: string;
  onSelect: (cat: string) => void;
}

const CategoryTabs = ({ selected, onSelect }: CategoryTabsProps) => (
  <div className="flex gap-1 md:gap-2 px-1 md:px-4 py-1.5 md:py-3 overflow-x-auto scrollbar-hidden" style={{ maxWidth: '100%' }}>
    {categories.map((cat) => (
      <button
        key={cat}
        onClick={() => onSelect(cat)}
        className={`category-chip flex-shrink-0 ${selected === cat ? "active" : ""}`}
      >
        {cat}
      </button>
    ))}
  </div>
);

export default CategoryTabs;
