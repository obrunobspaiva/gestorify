import { useState, useEffect, useRef } from "react";
import axios from "axios";
import React from "react";
import { IProductShopify } from "../../Interface/IProductShopify";
import { FaSave, FaChevronUp, FaChevronDown, FaEye, FaWpforms } from "react-icons/fa";

const API_URL = "http://localhost:5000/api/graphql";
const SHOPIFY_URL_PRODUCT = "https://admin.shopify.com/store/7dfd69/products/";
const SHOPIFY_STORE_URL = "https://7dfd69.myshopify.com/products/";

const formatCurrency = (value: string) => {
  const numericValue = parseFloat(value.replace(/[^0-9,.-]+/g, "").replace(",", "."));
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue);
};

const parseCurrency = (formattedValue: string) => {
  return formattedValue.replace(/[^0-9,.-]+/g, "").replace(",", ".");
};

const ProductShopify: React.FC = () => {
  const [products, setProducts] = useState<IProductShopify[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [editedPrices, setEditedPrices] = useState<{ [key: string]: string }>({});
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === "f") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    let hasNextPage = true;
    let endCursor = null;

    try {
      const query: any = {
        query: `{
            products(first: 250${endCursor ? `, after: "${endCursor}"` : ""}) {
              edges {
                node {
                  id
                  title
                  handle
                  images(first: 1) {
                    edges {
                      node {
                        src
                      }
                    }
                  }
                  variants(first: 100) {
                    edges {
                      node {
                        id
                        title
                        price
                        image {
                          src
                        }
                      }
                    }
                  }
                }
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }`
      };
      const response = await axios.post(API_URL, query);
      const formattedProducts = response.data.data.products.edges.map((product: any) => ({
        id: product.node.id,
        title: product.node.title,
        handle: product.node.handle,
        image: product.node.images.edges.length > 0 ? product.node.images.edges[0].node.src : "",
        variants: product.node.variants.edges.map((v: any) => ({
          id: v.node.id,
          title: v.node.title,
          price: formatCurrency(v.node.price),
          image: v.node.image ? v.node.image.src : ""
        }))
      }));

      hasNextPage = response.data.data.products.pageInfo.hasNextPage;
      endCursor = response.data.data.products.pageInfo.endCursor;
      setProducts(formattedProducts);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleAccordion = (productId: string) => {
    setExpandedProduct(expandedProduct === productId ? null : productId);
  };

  const updatePrice = async (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const updatedVariants = product.variants.map(variant => ({
      id: variant.id,
      price: parseCurrency(editedPrices[productId]),
    }));

    try {
      await axios.post(API_URL, {
        query: `mutation updateProductVariant {
          ${updatedVariants.map((variant, index) => `
            update${index}: productVariantUpdate(input: {
              id: "${variant.id}",
              price: "${variant.price}"
            }) {
              productVariant {
                id
                price
              }
            }
          `).join("\n")}
        }`
      });
    } catch (error) {
      console.error("Erro ao atualizar preço:", error);
    }
  };

  const handlePriceChange = (productId: string, value: string) => {
    const rawValue = value.replace(/[^0-9]/g, "");
    const formattedValue = new Intl.NumberFormat("pt-BR", {
      currency: "BRL",
      minimumFractionDigits: 2,
    }).format(parseFloat(rawValue) / 100);
    setEditedPrices({ ...editedPrices, [productId]: formattedValue });
  };

  const filteredProducts = products.filter(product =>
    (product.title.toLowerCase().includes(search.toLowerCase())) ||
    (product.variants[0].price.toLowerCase().includes(search.toLowerCase()))
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Produtos Shopify</h1>
      <input
        type="text"
        placeholder="Buscar produto..."
        className="border p-2 rounded mt-2 mb-4"
        value={search}
        ref={searchInputRef}
        onChange={(e) => setSearch(e.target.value)}
      />
      {loading && <>
        <div className="flex justify-center items-center my-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-blue-500"></div>
        </div>
        <p>Carregando produtos...</p>
      </>}
      {error && <p className="text-red-500">Erro: {error}</p>}
      {!loading &&
        <>
          <table className="w-full border border-gray-200 mt-4 fixed-table">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-2 border text-left">Imagem</th>
                <th className="px-4 py-2 border text-left">Nome</th>
                <th className="px-4 py-2 border text-left">Preço</th>
                <th className="px-4 py-2 border text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {currentProducts.map((product) => (
                <>
                  <tr key={product.id} className="border-b">
                    <td className="px-4 py-2 border">
                      {product.image && <img src={product.image} alt={product.title} className="w-10 h-10" />}
                    </td>
                    <td className="px-4 py-2 border text-left">{product.title}</td>
                    <td className="px-4 py-2 border">
                      <input
                        type="text"
                        className="border p-1 rounded w-24 text-center"
                        value={`${'R$ '}${editedPrices[product.id] || product.variants[0].price}`}
                        onChange={(e) => handlePriceChange(product.id, e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && updatePrice(product.id)}
                      />
                    </td>
                    <td className="px-2 border">
                      <button onClick={() => updatePrice(product.id)} className="text-green-600 hover:text-green-800">
                        <FaSave />
                      </button>
                      <button className="text-green-600 hover:text-green-800">
                        <a href={`${SHOPIFY_URL_PRODUCT}${product.id.replace(/^gid:\/\/shopify\/Product\//, "")}`} target="_blank">
                          <FaWpforms />
                        </a>
                      </button>
                      <button className="text-green-600 hover:text-green-800">
                        <a href={`${SHOPIFY_STORE_URL}${product.handle}`} target="_blank">
                          <FaEye />
                        </a>
                      </button>
                      <button onClick={() => toggleAccordion(product.id)} className="text-gray-600 hover:text-gray-800">
                        {expandedProduct === product.id ? <FaChevronUp /> : <FaChevronDown />}
                      </button>
                    </td>
                  </tr>
                  {expandedProduct === product.id && product.variants.map(variant => (
                    <tr key={variant.id} className="border-b">
                      <td className="px-4 py-2 border text-left">
                        {variant.image && <img src={variant.image} alt={variant.title} className="w-10 h-10" />}
                      </td>
                      <td className="px-4 py-2 border text-left">{variant.title}</td>
                      <td className="px-4 py-2 border">
                        <input
                          type="text"
                          className="border p-1 rounded w-24 text-center"
                          value={`${'R$ '}${editedPrices[variant.id] || variant.price}`}
                          disabled
                        />
                      </td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
          <div className="flex justify-between items-center mt-4">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded disabled:opacity-50"
            >
              Anterior
            </button>
            <span>Página {currentPage} de {totalPages} - {filteredProducts.length}</span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded disabled:opacity-50"
            >
              Próxima
            </button>
          </div>
        </>
      }
    </div>
  );

};

export default ProductShopify;
