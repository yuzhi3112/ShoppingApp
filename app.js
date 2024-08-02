const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');
const app = express();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/images');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

// Create MySQL connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'shopping'
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// Set up view engine and middleware
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));

// Define routes for products and categories
app.get('/', (req, res) => {
  // Fetch products
  connection.query('SELECT * FROM products', (errorProducts, resultsProducts) => {
    if (errorProducts) {
      console.error('Database query error for products:', errorProducts.message);
      return res.status(500).send('Error Retrieving products');
    }

    // Fetch categories
    connection.query('SELECT * FROM categories', (errorCategories, resultsCategories) => {
      if (errorCategories) {
        console.error('Database query error for categories:', errorCategories.message);
        return res.status(500).send('Error Retrieving categories');
      }

      // Render index.ejs with products and categories data
      res.render('index', {
        products: resultsProducts,
        categories: resultsCategories
      });
    });
  });
});

app.get('/product/:id', (req, res) => {
  const productId = req.params.id;
  const sql = 'SELECT * FROM products WHERE productId = ?';
  connection.query(sql, [productId], (error, results) => {
    if (error) {
      console.error('Database query error:', error.message);
      return res.status(500).send('Error retrieving product by ID');
    }
    if (results.length > 0) {
      res.render('product', { product: results[0] });
    } else {
      res.status(404).send('Product not found');
    }
  });
});

app.get('/addProduct', (req, res) => {
  res.render('addProduct');
});

app.post('/addProduct', upload.single('image'), (req, res) => {
  const { name, desc, quantity, price, categoryId } = req.body;
  let image = req.file ? req.file.filename : null;

  const sql = 'INSERT INTO products (productName, image, productDesc, quantity, price, categoryId) VALUES (?, ?, ?, ?, ?, ?)';
  connection.query(sql, [name, image, desc, quantity, price, categoryId], (error, results) => {
    if (error) {
      console.error("Error adding product:", error);
      res.status(500).send('Error adding product');
    } else {
      res.redirect('/');
    }
  });
});

app.get('/editProduct/:id', (req, res) => {
  const productId = req.params.id;
  const sql = 'SELECT * FROM products WHERE productId = ?';
  connection.query(sql, [productId], (error, results) => {
    if (error) {
      console.error('Database query error:', error.message);
      return res.status(500).send('Error retrieving product by ID');
    }
    if (results.length > 0) {
      res.render('editProduct', { product: results[0] });
    } else {
      res.status(404).send('Product not found');
    }
  });
});

app.post('/editProduct/:id', upload.single('image'), (req, res) => {
  const productId = req.params.id;
  const { name, productDesc , quantity , price , categoryId} = req.body;
  let image = req.body.currentImage;
  if (req.file) {
    image = req.file.filename;
  }

  const sql = 'UPDATE products SET  productName = ? , image = ?, productDesc = ? , quantity = ? , price = ? , categoryId = ?  WHERE productId = ? ';
  connection.query(sql, [name, image, productDesc , quantity , price , categoryId, productId], (error, results) => {
    if (error) {
      console.error('Error updating product:', error);
      res.status(500).send('Error updating product');
    } else {
      res.redirect('/');
    }
  });
});

app.get('/deleteProduct/:id', (req, res) => {
  const productId = req.params.id;
  const sql = 'DELETE FROM products WHERE productId = ?';
  connection.query(sql, [productId], (error, results) => {
    if (error) {
      console.error("Error deleting product:", error);
      res.status(500).send('Error deleting product');
    } else {
      res.redirect('/');
    }
  });
});

app.get('/category/:id', (req, res) => {
  const categoryId = req.params.id;
  const sql = 'SELECT * FROM categories WHERE categoryId = ?';
  connection.query(sql, [categoryId], (error, results) => {
    if (error) {
      console.error('Database query error:', error.message);
      return res.status(500).send('Error retrieving category by ID');
    }
    if (results.length > 0) {
      res.render('category', { category: results[0] });
    } else {
      res.status(404).send('Category not found');
    }
  });
});

app.get('/addCategory', (req, res) => {
  res.render('addCategory');
});

app.post('/addCategory', upload.single('image'), (req, res) => {
  const { categoryId , categoryName , categoryDesc} = req.body;
  let image = req.file ? req.file.filename : null;

  const sql = 'INSERT INTO categories (categoryId , categoryName , categoryDesc ) VALUES (?, ?, ?) ';
  connection.query(sql, [ categoryId , categoryName , categoryDesc], (error, results) => {
    if (error) {
      console.error("Error adding category:", error);
      res.status(500).send('Error adding category');
    } else {
      res.redirect('/');
    }
  });
});

app.get('/editCategory/:id', (req, res) => {
  const categoryId = req.params.id;
  const sql = 'SELECT * FROM categories WHERE categoryId = ?';
  connection.query(sql, [categoryId], (error, results) => {
    if (error) {
      console.error('Database query error:', error.message);
      return res.status(500).send('Error retrieving category by ID');
    }
    if (results.length > 0) {
      res.render('editCategory', { category : results[0] });
    } else {
      res.status(404).send('Category not found');
    }
  });
});

app.post('/editCategory/:id', (req, res) => {
  const categoryId = req.params.id;
  const { categoryName , categoryDesc} = req.body;

  const sql = 'UPDATE categories SET categoryName = ? , categoryDesc = ?  WHERE categoryId = ? ';
  connection.query(sql, [categoryName , categoryDesc , categoryId], (error, results) => {
    if (error) {
      console.error('Error updating category:', error);
      res.status(500).send('Error updating category');
    } else {
      res.redirect('/');
    }
  });
});

app.get('/shop.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'shop.html'));
});

app.get('/contact.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'contact.html'));
});



app.get('/deleteCategory/:id', (req, res) => {
  const categoryId = req.params.id;
  const sql = 'DELETE FROM categories WHERE categoryId = ?';
  connection.query(sql, [categoryId], (error, results) => {
    if (error) {
      console.error("Error deleting category:", error);
      res.status(500).send('Error deleting category');
    } else {
      res.redirect('/');
    }
  });
});



const PORT = process.env.PORT || 3305;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
