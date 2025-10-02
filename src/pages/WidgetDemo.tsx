import VoiceWidget from '@/components/voice/VoiceWidget';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Star } from 'lucide-react';

export default function WidgetDemo() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">DemoStore</h1>
          <nav className="hidden md:flex gap-6">
            <a href="#" className="text-muted-foreground hover:text-foreground">Home</a>
            <a href="#" className="text-muted-foreground hover:text-foreground">Shop</a>
            <a href="#" className="text-muted-foreground hover:text-foreground">About</a>
            <a href="#" className="text-muted-foreground hover:text-foreground">Contact</a>
          </nav>
          <Button variant="outline" size="icon">
            <ShoppingCart className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Hero Product Section */}
      <main className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Product Image */}
          <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <div className="text-6xl mb-4">📦</div>
              <p>Product Image</p>
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">(128 reviews)</span>
              </div>
              <h1 className="text-4xl font-bold mb-2">Premium Product</h1>
              <p className="text-3xl font-semibold text-primary">$99.99</p>
            </div>

            <p className="text-muted-foreground leading-relaxed">
              Experience the perfect blend of quality and style with our premium product. 
              Carefully crafted with attention to detail, this item is designed to exceed 
              your expectations and become your new favorite.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Size</label>
                <div className="flex gap-2">
                  {['S', 'M', 'L', 'XL'].map((size) => (
                    <Button key={size} variant="outline" className="w-12">
                      {size}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Quantity</label>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon">-</Button>
                  <span className="w-12 text-center">1</span>
                  <Button variant="outline" size="icon">+</Button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button className="w-full" size="lg">Add to Cart</Button>
              <Button className="w-full" variant="outline" size="lg">Buy Now</Button>
            </div>

            <div className="border-t pt-6 space-y-2 text-sm">
              <p className="flex justify-between">
                <span className="text-muted-foreground">SKU:</span>
                <span>DEMO-001</span>
              </p>
              <p className="flex justify-between">
                <span className="text-muted-foreground">Category:</span>
                <span>Premium</span>
              </p>
              <p className="flex justify-between">
                <span className="text-muted-foreground">Availability:</span>
                <span className="text-green-600">In Stock</span>
              </p>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="text-center p-6 border rounded-lg">
            <div className="text-3xl mb-2">🚚</div>
            <h3 className="font-semibold mb-2">Free Shipping</h3>
            <p className="text-sm text-muted-foreground">On orders over $50</p>
          </div>
          <div className="text-center p-6 border rounded-lg">
            <div className="text-3xl mb-2">↩️</div>
            <h3 className="font-semibold mb-2">Easy Returns</h3>
            <p className="text-sm text-muted-foreground">30-day return policy</p>
          </div>
          <div className="text-center p-6 border rounded-lg">
            <div className="text-3xl mb-2">🔒</div>
            <h3 className="font-semibold mb-2">Secure Payment</h3>
            <p className="text-sm text-muted-foreground">100% secure transactions</p>
          </div>
        </div>
      </main>

      {/* Voice Widget */}
      <VoiceWidget
        position="bottom-right"
        primaryColor="#008060"
        greetingMessage="Hi! I'm your AI shopping assistant. How can I help you today?"
        shopId="demo-store.myshopify.com"
      />
    </div>
  );
}
