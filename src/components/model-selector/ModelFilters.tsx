import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Gender, Ethnicity, AgeCategory, BodyType, UseCase } from "./modelData";

interface ModelFiltersProps {
  genderFilter: Gender | "all";
  setGenderFilter: (v: Gender | "all") => void;
  ethnicityFilter: Ethnicity | "all";
  setEthnicityFilter: (v: Ethnicity | "all") => void;
  ageCategoryFilter?: AgeCategory | "all";
  setAgeCategoryFilter?: (v: AgeCategory | "all") => void;
  bodyTypeFilter?: BodyType | "all";
  setBodyTypeFilter?: (v: BodyType | "all") => void;
  useCaseFilter?: UseCase | "all";
  setUseCaseFilter?: (v: UseCase | "all") => void;
}

const ethnicities: Ethnicity[] = ["European", "African", "Middle Eastern", "East Asian", "South Asian", "Latin American", "Mixed"];
const ageCategories: AgeCategory[] = ["1 – 2.5", "7 – 13", "13 – 18", "20 – 30", "30 – 50", "50 – 65", "65+"];
const bodyTypes: BodyType[] = ["Slim", "Athletic", "Average", "Curvy", "Overweight", "Plus size"];
const useCases: UseCase[] = ["Fashion", "E-commerce", "Lifestyle"];

const ModelFilters = ({
  genderFilter, setGenderFilter,
  ethnicityFilter, setEthnicityFilter,
  ageCategoryFilter = "all", setAgeCategoryFilter,
  bodyTypeFilter = "all", setBodyTypeFilter,
  useCaseFilter = "all", setUseCaseFilter,
}: ModelFiltersProps) => {
  const hasActiveFilters = genderFilter !== "all" || ethnicityFilter !== "all" ||
    ageCategoryFilter !== "all" || bodyTypeFilter !== "all" || useCaseFilter !== "all";

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Select value={genderFilter} onValueChange={(v) => setGenderFilter(v as Gender | "all")}>
        <SelectTrigger className="w-[130px] h-8 text-xs">
          <SelectValue placeholder="Gender" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Genders</SelectItem>
          <SelectItem value="female">Female</SelectItem>
          <SelectItem value="male">Male</SelectItem>
        </SelectContent>
      </Select>

      <Select value={ethnicityFilter} onValueChange={(v) => setEthnicityFilter(v as Ethnicity | "all")}>
        <SelectTrigger className="w-[160px] h-8 text-xs">
          <SelectValue placeholder="Background" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Backgrounds</SelectItem>
          {ethnicities.map((e) => (
            <SelectItem key={e} value={e}>{e}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {setAgeCategoryFilter && (
        <Select value={ageCategoryFilter} onValueChange={(v) => setAgeCategoryFilter(v as AgeCategory | "all")}>
          <SelectTrigger className="w-[130px] h-8 text-xs">
            <SelectValue placeholder="Age" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ages</SelectItem>
            {ageCategories.map((a) => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {setBodyTypeFilter && (
        <Select value={bodyTypeFilter} onValueChange={(v) => setBodyTypeFilter(v as BodyType | "all")}>
          <SelectTrigger className="w-[130px] h-8 text-xs">
            <SelectValue placeholder="Body Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Body Types</SelectItem>
            {bodyTypes.map((b) => (
              <SelectItem key={b} value={b}>{b}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {setUseCaseFilter && (
        <Select value={useCaseFilter} onValueChange={(v) => setUseCaseFilter(v as UseCase | "all")}>
          <SelectTrigger className="w-[130px] h-8 text-xs">
            <SelectValue placeholder="Use Case" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Use Cases</SelectItem>
            {useCases.map((u) => (
              <SelectItem key={u} value={u}>{u}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {hasActiveFilters && (
        <button
          className="text-xs text-muted-foreground hover:text-foreground underline"
          onClick={() => {
            setGenderFilter("all");
            setEthnicityFilter("all");
            setAgeCategoryFilter?.("all");
            setBodyTypeFilter?.("all");
            setUseCaseFilter?.("all");
          }}
        >
          Clear filters
        </button>
      )}
    </div>
  );
};

export default ModelFilters;
