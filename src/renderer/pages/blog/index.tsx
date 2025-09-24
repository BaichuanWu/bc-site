import React from 'react';
import { Routes, Route } from 'react-router-dom';
import EditorPage from './EditorPage';
import ListPage from './ListPage';
import DetailPage from './DetailPage';

export default function BlogIndexPage() {
  return (
    <Routes>
      <Route index element={<ListPage />} />
      <Route path="editor" element={<EditorPage />} />
      <Route path="list" element={<ListPage />} />
      <Route path=":id" element={<DetailPage />} />
    </Routes>
  );
}