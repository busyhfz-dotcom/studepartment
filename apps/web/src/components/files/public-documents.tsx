import { FILE_CATEGORIES, fileSize, type FileRecord } from "@/lib/files";
import styles from "./files.module.css";

export function PublicDocuments({ files }: { files: FileRecord[] }) {
  if (!files.length) return null;
  return <section className={styles.manager}><span className={styles.eyebrow}>Profile documents · self-reported</span><h2>Documents & portfolio</h2><p>Shared by the profile owner. Uploading a document does not mean it has been verified.</p><ul className={styles.list}>{files.map((file) => <li className={styles.publicFile} key={file.id}><div><strong>{file.name}</strong><small>{FILE_CATEGORIES[file.category]} · {fileSize(file.size)}</small></div><a href={file.url} download>Download ↗</a></li>)}</ul></section>;
}
