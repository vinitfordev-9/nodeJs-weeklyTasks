export default function CompanyLogo({ company }) {
  const name = company.companyName || "Company";
  const hash = [...name].reduce(
    (sum, character) => sum + character.charCodeAt(0),
    0,
  );
  return (
    <span className={`company-logo c${hash % 5}`}>{name.slice(0, 2)}</span>
  );
}
