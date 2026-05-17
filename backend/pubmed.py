"""
PubMed API integration for fetching clinical research papers.
Uses NCBI E-utilities (no API key required for basic use).
"""

import httpx
import xml.etree.ElementTree as ET
from typing import Optional
import asyncio

ESEARCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
EFETCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"


async def search_pubmed(query: str, max_results: int = 5) -> list[str]:
    """Search PubMed and return a list of PMIDs."""
    params = {
        "db": "pubmed",
        "term": query,
        "retmax": max_results,
        "retmode": "json",
        "sort": "relevance",
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(ESEARCH_URL, params=params)
        response.raise_for_status()
        data = response.json()
        pmids = data.get("esearchresult", {}).get("idlist", [])
        return pmids


async def fetch_abstracts(pmids: list[str]) -> list[dict]:
    """Fetch full abstract data for a list of PMIDs."""
    if not pmids:
        return []

    params = {
        "db": "pubmed",
        "id": ",".join(pmids),
        "retmode": "xml",
        "rettype": "abstract",
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(EFETCH_URL, params=params)
        response.raise_for_status()
        xml_content = response.text

    return parse_pubmed_xml(xml_content)


def parse_pubmed_xml(xml_content: str) -> list[dict]:
    """Parse PubMed XML response into structured paper dicts."""
    papers = []
    try:
        root = ET.fromstring(xml_content)
        articles = root.findall(".//PubmedArticle")

        for article in articles:
            paper = {}

            # PMID
            pmid_el = article.find(".//PMID")
            paper["pmid"] = pmid_el.text if pmid_el is not None else "N/A"

            # Title
            title_el = article.find(".//ArticleTitle")
            paper["title"] = (title_el.text or "").strip() if title_el is not None else "No title available"

            # Abstract
            abstract_parts = article.findall(".//AbstractText")
            if abstract_parts:
                abstract_text = " ".join(
                    (el.text or "") for el in abstract_parts if el.text
                )
                paper["abstract"] = abstract_text.strip()
            else:
                paper["abstract"] = "No abstract available."

            # Authors
            author_els = article.findall(".//Author")
            authors = []
            for author in author_els[:3]:  # limit to first 3
                last = author.find("LastName")
                first = author.find("ForeName")
                if last is not None:
                    name = last.text or ""
                    if first is not None:
                        name += f" {first.text[0]}." if first.text else ""
                    authors.append(name)
            paper["authors"] = ", ".join(authors) if authors else "Unknown authors"

            # Journal
            journal_el = article.find(".//Journal/Title")
            paper["journal"] = journal_el.text if journal_el is not None else "Unknown journal"

            # Publication year
            year_el = article.find(".//PubDate/Year")
            paper["year"] = year_el.text if year_el is not None else "N/A"

            # PubMed URL
            paper["url"] = f"https://pubmed.ncbi.nlm.nih.gov/{paper['pmid']}/"

            papers.append(paper)

    except ET.ParseError as e:
        print(f"XML parse error: {e}")

    return papers


async def get_clinical_papers(query: str, max_results: int = 5) -> list[dict]:
    """
    Full pipeline: search PubMed → fetch abstracts → return structured papers.
    Returns empty list if no results found (fallback handled in agent).
    """
    try:
        pmids = await search_pubmed(query, max_results)
        if not pmids:
            return []
        papers = await fetch_abstracts(pmids)
        return papers
    except httpx.HTTPError as e:
        print(f"PubMed HTTP error: {e}")
        return []
    except Exception as e:
        print(f"PubMed unexpected error: {e}")
        return []
