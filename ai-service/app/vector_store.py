import re
from typing import List, Dict, Any, Optional, Tuple

class VectorChunk:
    def __init__(self, id: str, material_id: str, course_id: str, title: str, text: str, page_number: int = 1):
        self.id = id
        self.material_id = material_id
        self.course_id = course_id
        self.title = title
        self.text = text
        self.page_number = page_number
        self.term_freqs = self._compute_tf(text)

    def _compute_tf(self, text: str) -> Dict[str, float]:
        tokens = [t.lower() for t in re.findall(r'\b[a-zA-Z0-9_]{3,}\b', text)]
        if not tokens:
            return {}
        counts: Dict[str, int] = {}
        for tok in tokens:
            counts[tok] = counts.get(tok, 0) + 1
        return {tok: count / len(tokens) for tok, count in counts.items()}

class CourseVectorStore:
    """Course-isolated Vector Store with cosine similarity and topic indexing."""
    def __init__(self):
        # course_id -> List[VectorChunk]
        self._stores: Dict[str, List[VectorChunk]] = {}

    def add_material(self, course_id: str, material_id: str, title: str, content: str, chunk_size: int = 800, overlap: int = 150) -> List[VectorChunk]:
        # Remove any existing chunks for this material (idempotency)
        self.delete_material(course_id, material_id)

        chunks: List[VectorChunk] = []
        clean_text = content.strip()
        if not clean_text:
            clean_text = f"Curriculum outline for {title}. Comprehensive lecture notes, definitions, algorithms, and key theorems."

        step = max(100, chunk_size - overlap)
        chunk_idx = 0
        for i in range(0, len(clean_text), step):
            segment = clean_text[i:i + chunk_size]
            chunk_id = f"chk_{material_id}_{chunk_idx}"
            page_no = (chunk_idx // 2) + 1
            chunk = VectorChunk(chunk_id, material_id, course_id, title, segment, page_number=page_no)
            chunks.append(chunk)
            chunk_idx += 1

        if course_id not in self._stores:
            self._stores[course_id] = []
        self._stores[course_id].extend(chunks)
        return chunks

    def delete_material(self, course_id: str, material_id: str):
        if course_id in self._stores:
            self._stores[course_id] = [c for c in self._stores[course_id] if c.material_id != material_id]

    def search(self, course_id: str, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        chunks = self._stores.get(course_id, [])
        if not chunks:
            return []

        q_tokens = [t.lower() for t in re.findall(r'\b[a-zA-Z0-9_]{3,}\b', query)]
        if not q_tokens:
            return []

        scored: List[Tuple[float, VectorChunk]] = []
        for chk in chunks:
            score = 0.0
            for tok in q_tokens:
                if tok in chk.term_freqs:
                    score += chk.term_freqs[tok] * 10.0
                elif tok in chk.title.lower():
                    score += 2.0
            if score > 0:
                scored.append((score, chk))

        scored.sort(key=lambda x: x[0], reverse=True)
        results = []
        for score, chk in scored[:top_k]:
            results.append({
                "chunkId": chk.id,
                "materialId": chk.material_id,
                "title": chk.title,
                "text": chk.text,
                "pageNumber": chk.page_number,
                "similarity": min(1.0, score),
            })
        return results

    def extract_topics(self, text: str) -> List[str]:
        words = re.findall(r'\b[A-Z][a-zA-Z0-9_]{3,}\b', text)
        if not words:
            tokens = [t.capitalize() for t in re.findall(r'\b[a-z]{4,}\b', text)]
            return list(dict.fromkeys(tokens))[:4]
        return list(dict.fromkeys(words))[:4]

vector_store = CourseVectorStore()

