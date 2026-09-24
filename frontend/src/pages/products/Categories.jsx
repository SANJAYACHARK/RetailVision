import {
  useEffect,
  useState,
} from "react";

import {
  Edit3,
  Plus,
  Tags,
  Trash2,
} from "lucide-react";

import api from "../../api/api";

import {
  useAuth,
} from "../../context/AuthContext";


function Categories() {

  const {
    isAdmin,
    isManager,
  } = useAuth();

  const canManage =
    isAdmin || isManager;


  const [categories, setCategories] =
    useState([]);

  const [name, setName] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [editingId, setEditingId] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);


  const loadCategories = async () => {

    setLoading(true);

    try {

      const response =
        await api.get(
          "products/categories/"
        );

      setCategories(
        response.data.results ||
        response.data
      );

    } catch (error) {

      console.error(
        "Failed to load categories:",
        error
      );

    } finally {

      setLoading(false);
    }
  };


  useEffect(() => {

    loadCategories();

  }, []);


  const resetForm = () => {

    setName("");
    setDescription("");
    setEditingId(null);
  };


  const handleSubmit =
    async (event) => {

      event.preventDefault();

      if (!name.trim()) {
        alert("Category name is required.");
        return;
      }

      setSaving(true);

      try {

        const payload = {
          name: name.trim(),
          description: description.trim(),
          is_active: true,
        };


        if (editingId) {

          await api.patch(
            `products/categories/${editingId}/`,
            payload
          );

        } else {

          await api.post(
            "products/categories/",
            payload
          );
        }


        resetForm();

        await loadCategories();

      } catch (error) {

        console.error(
          "Failed to save category:",
          error
        );

        alert(
          JSON.stringify(
            error.response?.data ||
            "Unable to save category.",
            null,
            2
          )
        );

      } finally {

        setSaving(false);
      }
    };


  const handleEdit =
    (category) => {

      setEditingId(category.id);

      setName(
        category.name || ""
      );

      setDescription(
        category.description || ""
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };


  const handleDelete =
    async (category) => {

      const confirmed =
        window.confirm(
          `Delete category "${category.name}"?`
        );

      if (!confirmed) {
        return;
      }


      try {

        await api.delete(
          `products/categories/${category.id}/`
        );

        if (editingId === category.id) {
          resetForm();
        }

        await loadCategories();

      } catch (error) {

        console.error(
          "Failed to delete category:",
          error
        );

        alert(
          "This category cannot be deleted because products may be using it."
        );
      }
    };


  return (

    <main className="page-container">

      <div className="page-inner categories-page">

        <header className="page-header">

          <div>

            <p className="page-eyebrow">
              Product Organization
            </p>

            <h1 className="page-title">
              Categories
            </h1>

            <p className="page-description">
              Organize your products into categories
              for easier management and reporting.
            </p>

          </div>


          <div className="page-header-summary">

            <span className="summary-number">
              {categories.length}
            </span>

            <span className="summary-label">
              Categories
            </span>

          </div>

        </header>


        {canManage && (

          <section className="category-form-card">

            <div className="section-heading">

              <div>

                <h2 className="section-title">
                  {
                    editingId
                      ? "Edit Category"
                      : "Add New Category"
                  }
                </h2>

                <p className="section-description">
                  {
                    editingId
                      ? "Update the selected category information."
                      : "Create a category for organizing your retail products."
                  }
                </p>

              </div>

            </div>


            <form
              onSubmit={handleSubmit}
              className="category-form-grid"
            >

              <div className="form-group">

                <label className="form-label">
                  Category Name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={
                    (event) =>
                      setName(
                        event.target.value
                      )
                  }
                  placeholder="Example: Electronics"
                  className="form-input"
                  required
                />

              </div>


              <div className="form-group">

                <label className="form-label">
                  Description
                </label>

                <input
                  type="text"
                  value={description}
                  onChange={
                    (event) =>
                      setDescription(
                        event.target.value
                      )
                  }
                  placeholder="Short category description"
                  className="form-input"
                />

              </div>


              <div className="category-form-actions">

                {editingId && (

                  <button
                    type="button"
                    onClick={resetForm}
                    className="secondary-button"
                  >
                    Cancel
                  </button>

                )}


                <button
                  type="submit"
                  disabled={saving}
                  className="primary-button"
                >

                  <Plus size={17} />

                  {
                    saving
                      ? "Saving..."
                      : editingId
                        ? "Update Category"
                        : "Add Category"
                  }

                </button>

              </div>

            </form>

          </section>

        )}


        <section className="category-list-card">

          <div className="section-heading category-list-heading">

            <div>

              <h2 className="section-title">
                All Categories
              </h2>

              <p className="section-description">
                View and manage product categories.
              </p>

            </div>

          </div>


          {loading ? (

            <div className="empty-state">

              <div className="loading-spinner" />

              <p>
                Loading categories...
              </p>

            </div>

          ) : categories.length === 0 ? (

            <div className="empty-state">

              <div className="empty-state-icon">
                <Tags size={28} />
              </div>

              <h3>
                No categories available
              </h3>

              <p>
                Add your first category to start
                organizing products.
              </p>

            </div>

          ) : (

            <div className="category-list">

              {categories.map(
                (category) => (

                  <div
                    key={category.id}
                    className="category-item"
                  >

                    <div className="category-item-main">

                      <div className="category-icon">

                        <Tags size={18} />

                      </div>


                      <div>

                        <div className="category-title-row">

                          <p className="category-name">
                            {category.name}
                          </p>


                          <span
                            className={
                              category.is_active
                                ? "badge badge-success"
                                : "badge badge-neutral"
                            }
                          >
                            {
                              category.is_active
                                ? "Active"
                                : "Inactive"
                            }
                          </span>

                        </div>


                        <p className="category-description">
                          {
                            category.description ||
                            "No description"
                          }
                        </p>

                      </div>

                    </div>


                    {canManage && (

                      <div className="table-actions">

                        <button
                          type="button"
                          onClick={
                            () =>
                              handleEdit(
                                category
                              )
                          }
                          className="icon-button"
                          title="Edit category"
                        >
                          <Edit3 size={16} />
                        </button>


                        <button
                          type="button"
                          onClick={
                            () =>
                              handleDelete(
                                category
                              )
                          }
                          className="
                            icon-button
                            icon-button-danger
                          "
                          title="Delete category"
                        >
                          <Trash2 size={16} />
                        </button>

                      </div>

                    )}

                  </div>

                )
              )}

            </div>

          )}

        </section>

      </div>

    </main>
  );
}


export default Categories;