import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Textarea } from "./components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./components/ui/dialog";
import { ChefHat, Phone, Mail, MapPin, Plus, Edit2, Trash2, LogOut, Utensils, Clock, Star } from "lucide-react";
import "./App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth context
const AuthContext = React.createContext();

const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      setIsAuthenticated(true);
    }
  }, [token]);

  const login = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => React.useContext(AuthContext);

// Components
const Navbar = ({ siteSettings }) => {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <ChefHat className="h-8 w-8 text-orange-600" />
            <span className="text-2xl font-bold text-gray-800">{siteSettings?.business_name || "Gourmet Catering"}</span>
          </div>
          <div className="hidden md:flex space-x-6">
            <a href="#home" className="text-gray-600 hover:text-orange-600 transition-colors">Home</a>
            <a href="#menu" className="text-gray-600 hover:text-orange-600 transition-colors">Menu</a>
            <a href="#about" className="text-gray-600 hover:text-orange-600 transition-colors">About</a>
            <a href="#contact" className="text-gray-600 hover:text-orange-600 transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </nav>
  );
};

const Hero = ({ siteSettings }) => {
  return (
    <section id="home" className="bg-gradient-to-br from-orange-50 to-amber-50 py-20">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-6">
          {siteSettings?.hero_title || "Exquisite Catering Services"}
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          {siteSettings?.hero_description || "Creating unforgettable culinary experiences for your special events. From intimate gatherings to grand celebrations, we bring gourmet flavors to your table."}
        </p>
        <div className="flex justify-center space-x-4">
          <Button size="lg" className="bg-orange-600 hover:bg-orange-700">
            View Our Menu
          </Button>
          <Button variant="outline" size="lg">
            Contact Us
          </Button>
        </div>
      </div>
    </section>
  );
};

const MenuSection = ({ siteSettings }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMenu();
    fetchCategories();
  }, []);

  const fetchMenu = async () => {
    try {
      const response = await axios.get(`${API}/menu`);
      setMenuItems(response.data);
    } catch (error) {
      console.error('Error fetching menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/menu/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const filteredItems = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  if (loading) {
    return (
      <section id="menu" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Loading Menu...</h2>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="menu" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">{siteSettings?.menu_title || "Our Menu"}</h2>
          <p className="text-lg text-gray-600">{siteSettings?.menu_description || "Crafted with the finest ingredients and culinary expertise"}</p>
        </div>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto mb-8" style={{ gridTemplateColumns: `repeat(${categories.length + 1}, minmax(0, 1fr))` }}>
            <TabsTrigger value="all">All</TabsTrigger>
            {categories.map(category => (
              <TabsTrigger key={category.name} value={category.name}>
                {category.name} ({category.count})
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory}>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map(item => (
                <Card key={item.id} className="group hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl font-semibold text-gray-800 group-hover:text-orange-600 transition-colors">
                        {item.name}
                      </h3>
                      <Badge variant="outline" className="text-orange-600 border-orange-600">
                        {item.category}
                      </Badge>
                    </div>
                    <p className="text-gray-600 mb-4">{item.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-orange-600">${item.price}</span>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <Utensils className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No items in this category</h3>
            <p className="text-gray-500">Please check other categories or contact us for custom options.</p>
          </div>
        )}
      </div>
    </section>
  );
};

const AboutSection = ({ siteSettings }) => {
  return (
    <section id="about" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold text-gray-800 mb-6">{siteSettings?.about_title || "About Gourmet Catering"}</h2>
            <p className="text-lg text-gray-600 mb-6">
              {siteSettings?.about_description || "With over 15 years of culinary excellence, we specialize in creating memorable dining experiences that perfectly complement your special occasions. Our team of expert chefs combines traditional techniques with modern flavors to deliver exceptional catering services."}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <span className="text-gray-700">15+ Years Experience</span>
              </div>
              <div className="flex items-center space-x-2">
                <ChefHat className="h-5 w-5 text-orange-600" />
                <span className="text-gray-700">Expert Chefs</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-orange-600" />
                <span className="text-gray-700">Premium Quality</span>
              </div>
              <div className="flex items-center space-x-2">
                <Utensils className="h-5 w-5 text-orange-600" />
                <span className="text-gray-700">Custom Menus</span>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-100 to-amber-100 p-8 rounded-lg">
            <div className="text-center">
              <ChefHat className="h-24 w-24 text-orange-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Our Promise</h3>
              <p className="text-gray-600">
                Every dish is crafted with passion, using only the finest ingredients to ensure 
                your event is truly unforgettable.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const ContactSection = ({ siteSettings }) => {
  return (
    <section id="contact" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Get In Touch</h2>
          <p className="text-lg text-gray-600">Ready to make your event extraordinary? Contact us today!</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <Card className="text-center p-6">
            <Phone className="h-12 w-12 text-orange-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Call Us</h3>
            <p className="text-gray-600">{siteSettings?.contact_phone1 || "(555) 123-4567"}</p>
            <p className="text-gray-600">{siteSettings?.contact_phone2 || "(555) 987-6543"}</p>
          </Card>

          <Card className="text-center p-6">
            <Mail className="h-12 w-12 text-orange-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Email Us</h3>
            <p className="text-gray-600">{siteSettings?.contact_email1 || "info@gourmetcatering.com"}</p>
            <p className="text-gray-600">{siteSettings?.contact_email2 || "orders@gourmetcatering.com"}</p>
          </Card>

          <Card className="text-center p-6">
            <MapPin className="h-12 w-12 text-orange-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Visit Us</h3>
            <p className="text-gray-600">{siteSettings?.contact_address1 || "123 Culinary Street"}</p>
            <p className="text-gray-600">{siteSettings?.contact_address2 || "Foodie City, FC 12345"}</p>
          </Card>
        </div>
      </div>
    </section>
  );
};

const Footer = ({ siteSettings }) => {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <ChefHat className="h-6 w-6 text-orange-600" />
            <span className="text-xl font-bold">{siteSettings?.business_name || "Gourmet Catering"}</span>
          </div>
          <p className="text-gray-400">
            {siteSettings?.footer_text || "© 2024 Gourmet Catering. All rights reserved."}
          </p>
        </div>
      </div>
    </footer>
  );
};

// Admin Components
const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, {
        username,
        password
      });
      
      login(response.data.access_token);
    } catch (error) {
      alert('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Admin Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

const AdminPanel = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [siteSettings, setSiteSettings] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showContentForm, setShowContentForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [activeTab, setActiveTab] = useState('menu');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    available: true,
    image_url: ''
  });
  const [contentData, setContentData] = useState({
    business_name: '',
    hero_title: '',
    hero_description: '',
    menu_title: '',
    menu_description: '',
    about_title: '',
    about_description: '',
    contact_phone1: '',
    contact_phone2: '',
    contact_email1: '',
    contact_email2: '',
    contact_address1: '',
    contact_address2: '',
    footer_text: ''
  });
  const { logout, token } = useAuth();

  useEffect(() => {
    fetchAdminMenu();
    fetchSiteSettings();
  }, []);

  const fetchAdminMenu = async () => {
    try {
      const response = await axios.get(`${API}/admin/menu`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMenuItems(response.data);
    } catch (error) {
      console.error('Error fetching admin menu:', error);
    }
  };

  const fetchSiteSettings = async () => {
    try {
      const response = await axios.get(`${API}/admin/site-settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSiteSettings(response.data);
      setContentData(response.data);
    } catch (error) {
      console.error('Error fetching site settings:', error);
    }
  };

  const handleContentSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await axios.put(`${API}/admin/site-settings`, contentData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setShowContentForm(false);
      fetchSiteSettings();
      alert('Website content updated successfully!');
    } catch (error) {
      console.error('Error updating site settings:', error);
      alert('Error updating website content');
    }
  };

  const startContentEdit = () => {
    setContentData(siteSettings);
    setShowContentForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingItem) {
        await axios.put(`${API}/admin/menu/${editingItem.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API}/admin/menu`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      setFormData({ name: '', description: '', price: '', category: '', available: true, image_url: '' });
      setShowAddForm(false);
      setEditingItem(null);
      fetchAdminMenu();
    } catch (error) {
      console.error('Error saving menu item:', error);
      alert('Error saving menu item');
    }
  };

  const handleDelete = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await axios.delete(`${API}/admin/menu/${itemId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchAdminMenu();
      } catch (error) {
        console.error('Error deleting menu item:', error);
        alert('Error deleting menu item');
      }
    }
  };

  const startEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      category: item.category,
      available: item.available,
      image_url: item.image_url || ''
    });
    setShowAddForm(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>
            <Button variant="outline" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mb-8">
            <TabsTrigger value="menu">Menu Management</TabsTrigger>
            <TabsTrigger value="content">Website Content</TabsTrigger>
          </TabsList>

          <TabsContent value="menu">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Menu Items</h2>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Menu Item
              </Button>
            </div>

            <div className="grid gap-6">
              {menuItems.map(item => (
                <Card key={item.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-2">
                          <h3 className="text-xl font-semibold">{item.name}</h3>
                          <Badge variant={item.available ? 'default' : 'secondary'}>
                            {item.available ? 'Available' : 'Unavailable'}
                          </Badge>
                          <Badge variant="outline">{item.category}</Badge>
                        </div>
                        <p className="text-gray-600 mb-2">{item.description}</p>
                        <p className="text-2xl font-bold text-orange-600">${item.price}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => startEdit(item)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="content">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Website Content</h2>
              <Button onClick={startContentEdit}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Website Content
              </Button>
            </div>

            {siteSettings && (
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Business Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p><strong>Business Name:</strong> {siteSettings.business_name}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Hero Section</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p><strong>Title:</strong> {siteSettings.hero_title}</p>
                    <p><strong>Description:</strong> {siteSettings.hero_description}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Menu Section</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p><strong>Title:</strong> {siteSettings.menu_title}</p>
                    <p><strong>Description:</strong> {siteSettings.menu_description}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>About Section</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p><strong>Title:</strong> {siteSettings.about_title}</p>
                    <p><strong>Description:</strong> {siteSettings.about_description}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p><strong>Phone 1:</strong> {siteSettings.contact_phone1}</p>
                    <p><strong>Phone 2:</strong> {siteSettings.contact_phone2}</p>
                    <p><strong>Email 1:</strong> {siteSettings.contact_email1}</p>
                    <p><strong>Email 2:</strong> {siteSettings.contact_email2}</p>
                    <p><strong>Address 1:</strong> {siteSettings.contact_address1}</p>
                    <p><strong>Address 2:</strong> {siteSettings.contact_address2}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Footer</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p><strong>Footer Text:</strong> {siteSettings.footer_text}</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Menu Item Dialog */}
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="image_url">Image URL (optional)</Label>
                <Input
                  id="image_url"
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="available"
                  checked={formData.available}
                  onChange={(e) => setFormData({...formData, available: e.target.checked})}
                />
                <Label htmlFor="available">Available</Label>
              </div>
              <div className="flex space-x-2">
                <Button type="submit" className="flex-1">
                  {editingItem ? 'Update' : 'Add'} Item
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  setShowAddForm(false);
                  setEditingItem(null);
                  setFormData({ name: '', description: '', price: '', category: '', available: true, image_url: '' });
                }}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Content Management Dialog */}
        <Dialog open={showContentForm} onOpenChange={setShowContentForm}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Website Content</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleContentSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="business_name">Business Name</Label>
                  <Input
                    id="business_name"
                    value={contentData.business_name}
                    onChange={(e) => setContentData({...contentData, business_name: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Hero Section</h3>
                <div>
                  <Label htmlFor="hero_title">Hero Title</Label>
                  <Input
                    id="hero_title"
                    value={contentData.hero_title}
                    onChange={(e) => setContentData({...contentData, hero_title: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="hero_description">Hero Description</Label>
                  <Textarea
                    id="hero_description"
                    value={contentData.hero_description}
                    onChange={(e) => setContentData({...contentData, hero_description: e.target.value})}
                    rows={3}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Menu Section</h3>
                <div>
                  <Label htmlFor="menu_title">Menu Title</Label>
                  <Input
                    id="menu_title"
                    value={contentData.menu_title}
                    onChange={(e) => setContentData({...contentData, menu_title: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="menu_description">Menu Description</Label>
                  <Textarea
                    id="menu_description"
                    value={contentData.menu_description}
                    onChange={(e) => setContentData({...contentData, menu_description: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">About Section</h3>
                <div>
                  <Label htmlFor="about_title">About Title</Label>
                  <Input
                    id="about_title"
                    value={contentData.about_title}
                    onChange={(e) => setContentData({...contentData, about_title: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="about_description">About Description</Label>
                  <Textarea
                    id="about_description"
                    value={contentData.about_description}
                    onChange={(e) => setContentData({...contentData, about_description: e.target.value})}
                    rows={4}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Contact Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contact_phone1">Phone 1</Label>
                    <Input
                      id="contact_phone1"
                      value={contentData.contact_phone1}
                      onChange={(e) => setContentData({...contentData, contact_phone1: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_phone2">Phone 2</Label>
                    <Input
                      id="contact_phone2"
                      value={contentData.contact_phone2}
                      onChange={(e) => setContentData({...contentData, contact_phone2: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_email1">Email 1</Label>
                    <Input
                      id="contact_email1"
                      type="email"
                      value={contentData.contact_email1}
                      onChange={(e) => setContentData({...contentData, contact_email1: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_email2">Email 2</Label>
                    <Input
                      id="contact_email2"
                      type="email"
                      value={contentData.contact_email2}
                      onChange={(e) => setContentData({...contentData, contact_email2: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_address1">Address Line 1</Label>
                    <Input
                      id="contact_address1"
                      value={contentData.contact_address1}
                      onChange={(e) => setContentData({...contentData, contact_address1: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_address2">Address Line 2</Label>
                    <Input
                      id="contact_address2"
                      value={contentData.contact_address2}
                      onChange={(e) => setContentData({...contentData, contact_address2: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Footer</h3>
                <div>
                  <Label htmlFor="footer_text">Footer Text</Label>
                  <Input
                    id="footer_text"
                    value={contentData.footer_text}
                    onChange={(e) => setContentData({...contentData, footer_text: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex space-x-2">
                <Button type="submit" className="flex-1">
                  Update Website Content
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  setShowContentForm(false);
                  setContentData(siteSettings);
                }}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

// Main App
const HomePage = () => {
  return (
    <div>
      <Navbar />
      <Hero />
      <MenuSection />
      <AboutSection />
      <ContactSection />
      <Footer />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <AdminPanel />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </BrowserRouter>
      </div>
    </AuthProvider>
  );
}

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/admin/login" replace />;
};

const AdminLoginPage = () => {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }
  
  return <AdminLogin />;
};

export default App;