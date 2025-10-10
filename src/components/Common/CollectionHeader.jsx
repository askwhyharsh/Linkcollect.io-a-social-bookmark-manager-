import React, { useContext, useEffect } from 'react';
import { useState } from 'react';
import Plus from '../../assets/plus.svg';
import Button from '../UI/Button/Button';
import CollectionModal from './CollectionModal';
import { useSelector } from 'react-redux';
import { switchMode } from '../../hooks/switchMode';
import { getCollection } from '../../api-services/collectionService';
const CollectionHeader = ({ name, isOwner, windowWidth, setQuery }) => {
  // sort by dropdown
  const auth = useSelector(state => state.auth);
  const collectionsState = useSelector(state => state.collection);
  const [openModal, setOpenModal] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isExportPopupOpen, setIsExportPopupOpen] = useState(false);

  // To handle modal open and close
  const createModalHandler = () => {
    setOpenModal(prev => !prev);
  };

  // getting current selected mode
  const { selectedMode } = useContext(switchMode);

  const toggleExport = () => setIsExportOpen(prev => !prev);

  // Export warning popup controlled via localStorage
  useEffect(() => {
    try {
      const closed = localStorage.getItem('isExportPopupClosed');
      if (closed === null) {
        localStorage.setItem('isExportPopupClosed', 'false');
        setIsExportPopupOpen(true);
      } else if (closed === 'false') {
        setIsExportPopupOpen(true);
      }
    } catch {}
  }, []);

  const closeExportPopup = () => {
    try {
      localStorage.setItem('isExportPopupClosed', 'true');
    } catch {}
    setIsExportPopupOpen(false);
  };

  const downloadFile = (filename, content, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const toJSONContent = collections => {
    // Strip IDs and isPublic as requested
    const sanitized = collections.map(c => {
      const { _id, isPublic, ...rest } = c || {};
      const timelines = Array.isArray(c?.timelines)
        ? c.timelines.map(t => {
            if (t && typeof t === 'object') {
              const { _id: tId, ...tRest } = t;
              return tRest;
            }
            // Avoid exporting raw timeline IDs
            return {};
          })
        : [];
      return { ...rest, timelines };
    });
    return JSON.stringify({ collections: sanitized }, null, 2);
  };

  const toCSVContent = collections => {
    // Flatten: one row per bookmark; omit IDs and isPublic
    const headers = [
      'collectionTitle',
      'isPinned',
      'views',
      'tags',
      'bookmarkTitle',
      'bookmarkUrl',
    ];
    const escapeCsv = value => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (/[",\n]/.test(str)) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    };
    const rows = [headers.join(',')];
    collections.forEach(c => {
      const base = [
        escapeCsv(c.title || ''),
        escapeCsv(c.isPinned),
        escapeCsv(c.views ?? 0),
        escapeCsv(Array.isArray(c.tags) ? c.tags.join('|') : ''),
      ];
      if (Array.isArray(c.timelines) && c.timelines.length > 0) {
        c.timelines.forEach(t => {
          const title = typeof t === 'object' ? t.title : '';
          const url = typeof t === 'object' ? t.link : '';
          rows.push([...base, escapeCsv(title), escapeCsv(url)].join(','));
        });
      } else {
        rows.push([...base, '', ''].join(','));
      }
    });
    return rows.join('\n');
  };

  const toTextContent = collections => {
    const lines = [];
    collections.forEach(c => {
      lines.push(`Collection: ${c.title}`);
      lines.push(
        `Pinned: ${c.isPinned ? 'Yes' : 'No'}  Views: ${c.views ?? 0}`
      );
      if (Array.isArray(c.tags) && c.tags.length) {
        lines.push(`Tags: ${c.tags.join(', ')}`);
      }
      lines.push('Bookmarks:');
      if (Array.isArray(c.timelines) && c.timelines.length > 0) {
        c.timelines.forEach((t, idx) => {
          if (typeof t === 'object') {
            lines.push(`  ${idx + 1}. ${t.title || ''} - ${t.link || ''}`);
          } else {
            // Avoid exporting raw IDs; show placeholder instead
            lines.push(`  ${idx + 1}. (bookmark)`);
          }
        });
      } else {
        lines.push('  (none)');
      }
      lines.push('');
    });
    return lines.join('\n');
  };

  const loadCollectionsWithTimelines = async collections => {
    const detailed = await Promise.all(
      collections.map(async c => {
        try {
          const res = await getCollection(c._id);
          const timelines = res?.data?.data?.timelines ?? c.timelines ?? [];
          return { ...c, timelines };
        } catch (e) {
          return c;
        }
      })
    );
    return detailed;
  };

  const handleExport = async format => {
    const collections = collectionsState?.collections || [];
    const safeCollections = Array.isArray(collections) ? collections : [];
    const detailedCollections =
      await loadCollectionsWithTimelines(safeCollections);
    const fileBase =
      'linkcollect_export_' + new Date().toISOString().split('T')[0];
    if (format === 'json') {
      const content = toJSONContent(detailedCollections);
      downloadFile(
        `${fileBase}.json`,
        content,
        'application/json;charset=utf-8'
      );
    } else if (format === 'csv') {
      const content = toCSVContent(detailedCollections);
      downloadFile(`${fileBase}.csv`, content, 'text/csv;charset=utf-8');
    } else if (format === 'text') {
      const content = toTextContent(detailedCollections);
      downloadFile(`${fileBase}.txt`, content, 'text/plain;charset=utf-8');
    }
    setIsExportOpen(false);
  };

  return (
    <React.Fragment>
      {isOwner && (
        <CollectionModal
          isOpen={openModal}
          modalCloseHandler={createModalHandler}
        />
      )}
      <div className="flex flex-col items-start justify-center w-full gap-4 ">
        {/* Modify this */}
        <div className="flex items-center justify-between w-full ">
          <p
            className={`text-left font-medium  text-[30px] ${
              selectedMode === 'dark' ? 'text-neutral-50' : 'text-neutral-700'
            } ${windowWidth < 700 ? 'hidden' : ''}`}
          >
            {name}
          </p>
          {auth.isLoggedIn && isOwner && (
            <div className="flex items-center gap-3 relative">
              {/* Export button and dropdown */}
              <Button
                variant="primary"
                className="h-[46px] px-4 whitespace-nowrap"
                onClick={toggleExport}
              >
                Export
              </Button>
              {isExportOpen && (
                <div
                  className={`absolute right-0 top-full mt-2 z-20 w-48 rounded-md shadow-lg border ${
                    selectedMode === 'dark'
                      ? 'bg-neutral-800 border-neutral-700 text-neutral-100'
                      : 'bg-white border-neutral-200 text-neutral-800'
                  }`}
                >
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                    onClick={() => handleExport('json')}
                  >
                    JSON
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                    onClick={() => handleExport('csv')}
                  >
                    CSV
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                    onClick={() => handleExport('text')}
                  >
                    Plain Text
                  </button>
                </div>
              )}
              <Button
                variant="primary"
                className="w-48 h-[46px] whitespace-nowrap"
                onClick={createModalHandler}
              >
                <img src={Plus} alt="" />
                Add collection
              </Button>
            </div>
          )}
        </div>
      </div>
      {isExportPopupOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeExportPopup}
          ></div>
          <div
            className={`relative z-40 max-w-lg w-full rounded-lg shadow-xl border ${
              selectedMode === 'dark'
                ? 'bg-neutral-900 border-neutral-800 text-neutral-100'
                : 'bg-white border-neutral-200 text-neutral-900'
            }`}
          >
            <div className="p-5">
              <h3 className="text-xl font-semibold mb-2">Important notice</h3>
              <p className="mb-4 leading-6">
                Linkcollect soon will be shutting down in few days, please
                export your collections right now for a backup
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="primary"
                  className="px-4 h-[40px] whitespace-nowrap"
                  onClick={() => handleExport('json')}
                >
                  Export JSON
                </Button>
                <Button
                  variant="primary"
                  className="px-4 h-[40px] whitespace-nowrap"
                  onClick={() => handleExport('csv')}
                >
                  Export CSV
                </Button>
                <Button
                  variant="primary"
                  className="px-4 h-[40px] whitespace-nowrap"
                  onClick={() => handleExport('text')}
                >
                  Export Text
                </Button>
                <Button
                  variant="secondary"
                  className="ml-auto px-4 h-[40px]"
                  onClick={closeExportPopup}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </React.Fragment>
  );
};

export default CollectionHeader;
