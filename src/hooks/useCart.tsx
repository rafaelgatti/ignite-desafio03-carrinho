import { createContext, ReactNode, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const storagedCart = localStorage.getItem('@RocketShoes:cart');

  const [cart, setCart] = useState<Product[]>(() => {
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }
    return [];
  });

  useEffect(() => {
    if(!storagedCart || (JSON.parse(storagedCart) !== cart)){
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
    }
  }, [cart])


  const addProduct = async (productId: number) => {
    try {
      const productInCart = cart.find(product => product.id === productId);
      const itensDisponiveis = await api.get(`/stock/${productId}`)
        .then(response => response.data);

      if(itensDisponiveis.amount === 0 || (productInCart && productInCart.amount >= itensDisponiveis.amount)){
        toast.error('Quantidade solicitada fora de estoque');
      
      } else if(productInCart){
        const carrinho = cart.map(product => {
          return {...product, amount: product.amount + 1}
        });
        setCart(carrinho);
        
      } else {
        const produto = await api.get(`/products/${productId}`)
          .then(response => response.data);

        setCart([
          ...cart,
          {...produto, amount: 1}]);
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const carrinho = cart.filter(product => product.id !== productId);
      setCart(carrinho);
    
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const itensDisponiveis = await api.get(`/stock/${productId}`)
        .then(response => response.data);

        if(amount > itensDisponiveis.amount){
          toast.error('Quantidade solicitada fora de estoque');
        
        } else {
          const carrinho = cart.map(product => {
            if(product.id === productId) {
              return {...product, amount};
            }
            return product;
          });
          setCart(carrinho);
        }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
