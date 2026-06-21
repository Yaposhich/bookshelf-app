const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  // Books
  getBooks:        ()             => ipcRenderer.invoke('books:getAll'),
  addBook:         (book)         => ipcRenderer.invoke('books:add', book),
  updateBook:      (book)         => ipcRenderer.invoke('books:update', book),
  updateProgress:  (id, page)     => ipcRenderer.invoke('books:updateProgress', { id, current_page: page }),
  deleteBook:      (id)           => ipcRenderer.invoke('books:delete', id),
  searchBooks:     (q)            => ipcRenderer.invoke('books:search', q),
  pickCover:       (bookId)       => ipcRenderer.invoke('books:pickCover', bookId),

  // Quotes
  getAllQuotes:    ()             => ipcRenderer.invoke('quotes:getAll'),
  getBookQuotes:  (bookId)       => ipcRenderer.invoke('quotes:getByBook', bookId),
  addQuote:       (quote)        => ipcRenderer.invoke('quotes:add', quote),
  updateQuote:    (quote)        => ipcRenderer.invoke('quotes:update', quote),
  deleteQuote:    (id)           => ipcRenderer.invoke('quotes:delete', id),

  // Shelves
  getShelves:       ()                       => ipcRenderer.invoke('shelves:getAll'),
  addShelf:         (shelf)                  => ipcRenderer.invoke('shelves:add', shelf),
  updateShelf:      (shelf)                  => ipcRenderer.invoke('shelves:update', shelf),
  deleteShelf:      (id)                     => ipcRenderer.invoke('shelves:delete', id),
  getShelfBooks:    (shelfId)               => ipcRenderer.invoke('shelves:getBooks', shelfId),
  addBookToShelf:   (shelf_id, book_id)     => ipcRenderer.invoke('shelves:addBook', { shelf_id, book_id }),
  removeBookFromShelf: (shelf_id, book_id)  => ipcRenderer.invoke('shelves:removeBook', { shelf_id, book_id }),

  // Data export/import
  exportData:        ()           => ipcRenderer.invoke('data:export'),
  importData:        ()           => ipcRenderer.invoke('data:import'),

  // Analytics
  track:             (name, props) => ipcRenderer.invoke('analytics:track', { name, props }),
  exportAnalytics:   ()           => ipcRenderer.invoke('analytics:exportFile'),

  // Tags & Stats
  getTags:        ()             => ipcRenderer.invoke('tags:getAll'),
  getStats:       ()             => ipcRenderer.invoke('stats:get'),
})
