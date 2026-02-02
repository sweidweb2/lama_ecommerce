import { ProductWithRelations, Category, Brand } from '@/types/product';

export const DUMMY_CATEGORIES: Category[] = [
    {
        id: 'cat-1',
        name: 'Electronics',
        slug: 'electronics',
        parent_id: null,
        is_active: true,
        created_at: new Date().toISOString(),
        deleted_at: null,
    },
    {
        id: 'cat-2',
        name: 'Fashion',
        slug: 'fashion',
        parent_id: null,
        is_active: true,
        created_at: new Date().toISOString(),
        deleted_at: null,
    },
    {
        id: 'cat-3',
        name: 'Home & Garden',
        slug: 'home-garden',
        parent_id: null,
        is_active: true,
        created_at: new Date().toISOString(),
        deleted_at: null,
    },
    {
        id: 'cat-4',
        name: 'Sports',
        slug: 'sports',
        parent_id: null,
        is_active: true,
        created_at: new Date().toISOString(),
        deleted_at: null,
    }
];

export const DUMMY_BRANDS: Brand[] = [
    {
        id: 'brand-1',
        name: 'Lama Tech',
        slug: 'lama-tech',
        logo_image_url: null,
        created_at: new Date().toISOString(),
        deleted_at: null,
    },
    {
        id: 'brand-2',
        name: 'Aviora Noir',
        slug: 'aviora-noir',
        logo_image_url: null,
        created_at: new Date().toISOString(),
        deleted_at: null,
    }
];

export const DUMMY_PRODUCTS: ProductWithRelations[] = [
    {
        id: 'prod-1',
        name: 'Premium Wireless Headphones',
        description: 'High-quality wireless headphones with noise cancellation.',
        slug: 'premium-wireless-headphones',
        brand_id: 'brand-1',
        category_id: 'cat-1',
        sku: 'HW-001',
        price: 299.99,
        is_featured: true,
        is_trending: true,
        is_active: true,
        owner_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
        category: DUMMY_CATEGORIES[0],
        brand: DUMMY_BRANDS[0],
        images: [
            { id: 'img-1', product_id: 'prod-1', url_image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop', is_primary: true, created_at: new Date().toISOString() }
        ],
        variants: [
            { id: 'v-prod-1', product_id: 'prod-1', color: 'Black', size: 'One Size', material: 'Plastic', quantity_stock: 50, sku_variant: 'HW-001-B', price_override: null, created_at: new Date().toISOString(), deleted_at: null }
        ]
    },
    {
        id: 'prod-2',
        name: 'Minimalist Leather Watch',
        description: 'A sleek, minimalist watch with a genuine leather strap.',
        slug: 'minimalist-leather-watch',
        brand_id: 'brand-2',
        category_id: 'cat-2',
        sku: 'LW-002',
        price: 149.50,
        is_featured: true,
        is_trending: false,
        is_active: true,
        owner_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
        category: DUMMY_CATEGORIES[1],
        brand: DUMMY_BRANDS[1],
        images: [
            { id: 'img-2', product_id: 'prod-2', url_image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop', is_primary: true, created_at: new Date().toISOString() }
        ],
        variants: [
            { id: 'v-prod-2', product_id: 'prod-2', color: 'Brown', size: 'One Size', material: 'Leather', quantity_stock: 30, sku_variant: 'LW-002-BR', price_override: null, created_at: new Date().toISOString(), deleted_at: null }
        ]
    },
    {
        id: 'prod-3',
        name: 'Smart Home Speaker',
        description: 'Voice-controlled smart speaker with premium sound.',
        slug: 'smart-home-speaker',
        brand_id: 'brand-1',
        category_id: 'cat-1',
        sku: 'SS-003',
        price: 79.99,
        is_featured: false,
        is_trending: true,
        is_active: true,
        owner_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
        category: DUMMY_CATEGORIES[0],
        brand: DUMMY_BRANDS[0],
        images: [
            { id: 'img-3', product_id: 'prod-3', url_image: 'https://images.unsplash.com/photo-1589492477829-5e65395b66cc?q=80&w=1000&auto=format&fit=crop', is_primary: true, created_at: new Date().toISOString() }
        ],
        variants: [
            { id: 'v-prod-3', product_id: 'prod-3', color: 'Charcoal', size: 'One Size', material: 'Fabric', quantity_stock: 100, sku_variant: 'SS-003-C', price_override: null, created_at: new Date().toISOString(), deleted_at: null }
        ]
    },
    {
        id: 'prod-4',
        name: 'Modern Table Lamp',
        description: 'Elegant table lamp for your workspace or bedside.',
        slug: 'modern-table-lamp',
        brand_id: null,
        category_id: 'cat-3',
        sku: 'ML-004',
        price: 45.00,
        is_featured: false,
        is_trending: false,
        is_active: true,
        owner_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
        category: DUMMY_CATEGORIES[2],
        images: [
            { id: 'img-4', product_id: 'prod-4', url_image: 'https://images.unsplash.com/photo-1534073828943-f801091bb18c?q=80&w=1000&auto=format&fit=crop', is_primary: true, created_at: new Date().toISOString() }
        ],
        variants: [
            { id: 'v-prod-4', product_id: 'prod-4', color: 'White', size: 'One Size', material: 'Metal', quantity_stock: 25, sku_variant: 'ML-004-W', price_override: null, created_at: new Date().toISOString(), deleted_at: null }
        ]
    },
    {
        id: 'prod-5',
        name: 'Classic White Sneakers',
        description: 'Versatile white sneakers for daily wear. Made from high-quality synthetic leather with a durable rubber sole for maximum comfort and style.',
        slug: 'classic-white-sneakers',
        brand_id: null,
        category_id: 'cat-2',
        sku: 'CS-005',
        price: 85.00,
        is_featured: true,
        is_trending: true,
        is_active: true,
        owner_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
        category: DUMMY_CATEGORIES[1],
        images: [
            { id: 'img-5', product_id: 'prod-5', url_image: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?q=80&w=1000&auto=format&fit=crop', is_primary: true, created_at: new Date().toISOString() },
            { id: 'img-5-2', product_id: 'prod-5', url_image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=1000&auto=format&fit=crop', is_primary: false, created_at: new Date().toISOString() }
        ],
        variants: [
            { id: 'v-1', product_id: 'prod-5', color: 'White', size: 'S', material: 'Synthetic', quantity_stock: 10, sku_variant: 'CS-005-W-S', price_override: null, created_at: new Date().toISOString(), deleted_at: null },
            { id: 'v-2', product_id: 'prod-5', color: 'White', size: 'M', material: 'Synthetic', quantity_stock: 15, sku_variant: 'CS-005-W-M', price_override: null, created_at: new Date().toISOString(), deleted_at: null },
            { id: 'v-3', product_id: 'prod-5', color: 'White', size: 'L', material: 'Synthetic', quantity_stock: 5, sku_variant: 'CS-005-W-L', price_override: null, created_at: new Date().toISOString(), deleted_at: null },
            { id: 'v-4', product_id: 'prod-5', color: 'Black', size: 'M', material: 'Synthetic', quantity_stock: 8, sku_variant: 'CS-005-B-M', price_override: 90.00, created_at: new Date().toISOString(), deleted_at: null }
        ]
    },
    {
        id: 'prod-6',
        name: 'Yoga Mat Eco-Friendly',
        description: 'Sustainable yoga mat with non-slip surface. Perfect for all types of yoga and fitness exercises. Easy to clean and carry.',
        slug: 'yoga-mat-eco-friendly',
        brand_id: null,
        category_id: 'cat-4',
        sku: 'YM-006',
        price: 55.00,
        is_featured: false,
        is_trending: false,
        is_active: true,
        owner_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
        category: DUMMY_CATEGORIES[3],
        images: [
            { id: 'img-6', product_id: 'prod-6', url_image: 'https://images.unsplash.com/photo-1592432678016-e910b452f9a2?q=80&w=1000&auto=format&fit=crop', is_primary: true, created_at: new Date().toISOString() }
        ],
        variants: [
            { id: 'v-5', product_id: 'prod-6', color: 'Green', size: 'Standard', material: 'TPE', quantity_stock: 20, sku_variant: 'YM-006-G', price_override: null, created_at: new Date().toISOString(), deleted_at: null },
            { id: 'v-6', product_id: 'prod-6', color: 'Blue', size: 'Standard', material: 'TPE', quantity_stock: 12, sku_variant: 'YM-006-B', price_override: null, created_at: new Date().toISOString(), deleted_at: null }
        ]
    }
];
