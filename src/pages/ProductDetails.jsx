
import ProductFeaturesEditor from "./ProductFeaturesEditor";

const ProductDetails = ({ product, onSave }) => {
  if (!product)
    return (
      <div className="empty-state">
        <h3>No Product Selected</h3>
        <p>Select a product to view details</p>
      </div>
    );

  return (
    <div className="product-details">

      <h2>{product.name}</h2>
      <p>Type: {product.type}</p>

      <ProductFeaturesEditor
        product={product}
        onSave={onSave}
      />

    </div>
  );
};

export default ProductDetails;