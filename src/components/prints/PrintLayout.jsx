import React from 'react';

export const printPageClass =
  'print-area p-6 max-w-4xl mx-auto bg-white text-gray-900';
export const printPageStyle = { fontFamily: 'Arial, sans-serif', fontSize: '12px' };

export const PrintSection = ({ title, children }) => (
  <section className="mb-5">
    <h2 className="text-sm font-bold text-green-800 uppercase border-b border-gray-200 pb-1 mb-3">
      {title}
    </h2>
    {children}
  </section>
);

export const PrintKeyValueGrid = ({ items }) => (
  <table className="w-full text-sm">
    <tbody>
      {items.map((group, idx) => (
        <tr key={idx}>
          {group.map((item, i) => (
            <React.Fragment key={i}>
              <td className="font-semibold text-gray-600 py-1 w-1/4 align-top">{item.label}</td>
              <td className="py-1 align-top" colSpan={item.colSpan || 1}>{item.value}</td>
            </React.Fragment>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

export const PrintDataTable = ({ columns, rows, footer }) => (
  <table className="data-table w-full text-sm border-collapse">
    <thead>
      <tr className="bg-green-50">
        {columns.map((col) => (
          <th
            key={col.key}
            className={`border border-gray-200 px-2 py-2 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
          >
            {col.label}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {rows.map((row, idx) => (
        <tr key={idx}>
          {columns.map((col) => (
            <td
              key={col.key}
              className={`border border-gray-200 px-2 py-2 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${col.mono ? 'font-mono' : ''}`}
            >
              {row[col.key] ?? '—'}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
    {footer && <tfoot>{footer}</tfoot>}
  </table>
);

export const PrintSignatures = ({ items }) => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center text-sm">
    {items.map((item) => (
      <div key={item.label} className="border border-gray-200 p-4 min-h-[100px]">
        <p className="font-semibold mb-8">{item.label}</p>
        {item.hint && <p className="text-xs text-gray-500 mb-4">{item.hint}</p>}
        <p className="mt-6 border-t border-gray-400 pt-2">{item.footer || 'Signature'}</p>
      </div>
    ))}
  </div>
);

export const PrintActionBar = ({ children }) => (
  <div className="no-print mb-4 flex flex-wrap gap-2">{children}</div>
);

export const PrintButton = ({ onClick, variant = 'primary', children, disabled }) => {
  const classes =
    variant === 'secondary'
      ? 'px-4 py-2 border border-green-700 text-green-800 rounded-lg hover:bg-green-50 disabled:opacity-50'
      : 'px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-50';
  return (
    <button type="button" onClick={onClick} className={classes} disabled={disabled}>
      {children}
    </button>
  );
};

export const PrintLoading = ({ message = 'Chargement...' }) => (
  <div className="p-8 text-center text-gray-600">{message}</div>
);

export const PrintError = ({ message }) => (
  <div className="p-8 text-center text-red-600">{message}</div>
);
