import fs from 'fs';
import path from 'path';

// Scaffolds a new migration from a template.
// Usage: npm run migrate:make -- --template create-table --name add-clients-table [--table clients] [--column foo] [--references studios]
const args = process.argv.slice(2);
const getArg = (flag: string) => {
  const i = args.indexOf(`--${flag}`);
  return i !== -1 ? args[i + 1] : undefined;
};

const template = getArg('template') ?? 'create-table';
const name = getArg('name');
if (!name) {
  console.error('Usage: npm run migrate:make -- --template <create-table|add-column|alter-column|add-foreign-key> --name <migration-name>');
  process.exit(1);
}

const templatePath = path.join(__dirname, '..', 'migrations', 'templates', `${template}.template.ts`);
if (!fs.existsSync(templatePath)) {
  console.error(`Unknown template "${template}". Available: create-table, add-column, alter-column, add-foreign-key`);
  process.exit(1);
}

let content = fs.readFileSync(templatePath, 'utf8');
content = content.replace(/\.\.\/\.\.\/db\/migrator/g, '../db/migrator');

const table = getArg('table') ?? '__TABLE_NAME__';
const column = getArg('column') ?? '__COLUMN_NAME__';
const references = getArg('references') ?? '__REFERENCED_TABLE__';
content = content
  .replace(/__TABLE_NAME__/g, table)
  .replace(/__COLUMN_NAME__/g, column)
  .replace(/__REFERENCED_TABLE__/g, references);

const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
const fileName = `${timestamp}-${name}.ts`;
const outPath = path.join(__dirname, '..', 'migrations', fileName);

fs.writeFileSync(outPath, content);
console.log(`Created ${path.relative(process.cwd(), outPath)}`);
