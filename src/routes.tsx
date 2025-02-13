import { Routes, Route } from "react-router-dom";
import ProductShopify from "./pages/Shopify/ProductShopify";
import App from "./App";

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<App />} />
            <Route path="/product-shopify" element={<ProductShopify />} />
        </Routes>
    );
};

export default AppRoutes;
